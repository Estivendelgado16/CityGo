import json
import re
from dataclasses import dataclass, field
from typing import AsyncGenerator

from openai import AsyncOpenAI

from app.config import get_settings
from app.agent.tools import AGENT_TOOLS
from app.agent.tool_executor import execute_tool
from app.prompts.system_prompt import build_system_prompt

settings = get_settings()
openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

_VALID_FINISH_REASONS = {"stop", "tool_calls", "length", "content_filter"}

_PLACE_CARD_REQUIRED = {"place_id", "name"}
_EVENT_CARD_REQUIRED = {"event_id", "name"}

MAX_CARDS = 3
MAX_PREF_UPDATES = 2


@dataclass
class _AgentState:
    """Estado interno del orquestador para una sesión de agente."""
    recommended_ids: set = field(default_factory=set)
    cards_emitted: int = 0
    search_done: bool = False
    pref_updates: int = 0


async def agent_loop(
    user_message: str,
    user_id: str,
    conversation_id: str | None,
) -> AsyncGenerator[dict, None]:
    """
    Loop agéntico ReAct. El modelo controla cuántas iteraciones hacer.
    Yields eventos tipados que se empaquetan como SSE.
    """
    MAX_ITERATIONS = settings.MAX_AGENT_ITERATIONS
    state = _AgentState()

    user_prefs = await _get_user_preferences(user_id)
    chat_history = await _get_chat_history(user_id, conversation_id, limit=20)

    messages = [
        {"role": "system", "content": build_system_prompt(user_prefs)},
        *chat_history,
        {"role": "user", "content": user_message},
    ]

    for _ in range(MAX_ITERATIONS):
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=AGENT_TOOLS,
            tool_choice="auto",
            temperature=0.7,
        )

        choice = response.choices[0]
        message = choice.message
        finish_reason = choice.finish_reason

        if finish_reason not in _VALID_FINISH_REASONS:
            yield {"type": "text_delta", "content": "Parce, algo inesperado pasó. Intenta de nuevo."}
            return

        if finish_reason == "stop":
            async for event in _parse_response(message.content or "", state):
                yield event
            return

        if finish_reason == "tool_calls" and message.tool_calls:
            messages.append(message.model_dump())

            for tool_call in message.tool_calls:
                tool_name = tool_call.function.name

                try:
                    tool_args = json.loads(tool_call.function.arguments)
                except json.JSONDecodeError:
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps({"error": "Argumentos JSON inválidos"}),
                    })
                    continue

                # Política: obtener_detalles_lugar requiere buscar_lugares previo
                if tool_name == "obtener_detalles_lugar" and not state.search_done:
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": json.dumps({
                            "error": "Debes llamar buscar_lugares primero para obtener un place_id válido."
                        }),
                    })
                    continue

                # Política: máximo MAX_PREF_UPDATES actualizaciones de preferencias por sesión
                if tool_name == "actualizar_preferencias_usuario":
                    if state.pref_updates >= MAX_PREF_UPDATES:
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "content": json.dumps({
                                "status": "omitido",
                                "razon": "Límite de actualizaciones de preferencias alcanzado en esta sesión.",
                            }),
                        })
                        continue
                    state.pref_updates += 1

                yield {"type": "thinking", "content": _thinking_text(tool_name, tool_args)}

                try:
                    result = await execute_tool(tool_name, tool_args, user_id)
                except Exception as e:
                    result = {"error": f"Fallo inesperado en {tool_name}: {str(e)}"}

                if tool_name == "buscar_lugares":
                    state.search_done = True

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result, ensure_ascii=False, default=str),
                })
            continue

    # Se agotaron las iteraciones
    yield {"type": "text_delta", "content": "Parce, me tomó más de lo esperado. Déjame darte lo mejor que encontré."}


def _thinking_text(tool_name: str, tool_args: dict) -> str:
    texts = {
        "buscar_lugares": f"Buscando {tool_args.get('categoria', 'lugares')} en Medellín...",
        "consultar_feedback_comunitario": "Revisando lo que dicen otros usuarios...",
        "obtener_detalles_lugar": "Obteniendo detalles del lugar...",
        "buscar_eventos_por_fecha": "Buscando eventos para esas fechas...",
        "actualizar_preferencias_usuario": "Anotando tus gustos...",
    }
    return texts.get(tool_name, "Buscando información...")


async def _parse_response(content: str, state: _AgentState | None = None) -> AsyncGenerator[dict, None]:
    """Convierte la respuesta del agente en eventos SSE (texto + cards)."""
    if state is None:
        state = _AgentState()
    card_pattern = r'\[(PLACE_CARD|EVENT_CARD):\{(.*?)\}\]'

    last_end = 0
    for match in re.finditer(card_pattern, content, re.DOTALL):
        text_before = content[last_end:match.start()].strip()
        if text_before:
            for word in text_before.split(" "):
                if word:
                    yield {"type": "text_delta", "content": word + " "}

        card_type = match.group(1)

        try:
            card_data = json.loads("{" + match.group(2) + "}")
        except json.JSONDecodeError:
            # Fallback visible: no descartamos silenciosamente
            yield {"type": "text_delta", "content": f"[{card_type} — formato inválido] "}
            last_end = match.end()
            continue

        required = _PLACE_CARD_REQUIRED if card_type == "PLACE_CARD" else _EVENT_CARD_REQUIRED
        id_key = "place_id" if card_type == "PLACE_CARD" else "event_id"

        # Esquema mínimo obligatorio
        if not required.issubset(card_data.keys()):
            last_end = match.end()
            continue

        card_id = card_data.get(id_key, "")

        # Evitar duplicados por ID
        if card_id in state.recommended_ids:
            last_end = match.end()
            continue

        # Límite de cards por respuesta
        if state.cards_emitted >= MAX_CARDS:
            last_end = match.end()
            continue

        state.recommended_ids.add(card_id)
        state.cards_emitted += 1

        event_type = "place_card" if card_type == "PLACE_CARD" else "event_card"
        yield {"type": event_type, "data": card_data}

        last_end = match.end()

    remaining = content[last_end:].strip()
    if remaining:
        for word in remaining.split(" "):
            if word:
                yield {"type": "text_delta", "content": word + " "}


async def _get_user_preferences(user_id: str) -> dict:
    from app.services.supabase_client import get_supabase

    supabase = get_supabase()
    response = supabase.table("user_preferences").select("*").eq("user_id", user_id).single().execute()
    return response.data if response.data else {}


async def _get_chat_history(user_id: str, conversation_id: str | None, limit: int = 20) -> list[dict]:
    if not conversation_id:
        return []

    from app.services.supabase_client import get_supabase

    supabase = get_supabase()
    response = (
        supabase.table("chat_messages")
        .select("role, content")
        .eq("user_id", user_id)
        .eq("conversation_id", conversation_id)
        .order("created_at", desc=False)
        .limit(limit)
        .execute()
    )
    return [{"role": m["role"], "content": m["content"]} for m in (response.data or [])]
