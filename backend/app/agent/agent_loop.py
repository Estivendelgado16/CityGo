import json
import re
from typing import AsyncGenerator
from openai import AsyncOpenAI

from app.config import get_settings
from app.agent.tools import AGENT_TOOLS
from app.agent.tool_executor import execute_tool
from app.prompts.system_prompt import build_system_prompt

settings = get_settings()
openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

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

    # Contexto del usuario
    user_prefs = await _get_user_preferences(user_id)
    chat_history = await _get_chat_history(user_id, conversation_id, limit=20)

    messages = [
        {"role": "system", "content": build_system_prompt(user_prefs)},
        *chat_history,
        {"role": "user", "content": user_message},
    ]

    for iteration in range(MAX_ITERATIONS):
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=AGENT_TOOLS,
            tool_choice="auto",
            temperature=0.7,
        )

        choice = response.choices[0]
        message = choice.message

        # El modelo decidió responder
        if choice.finish_reason == "stop":
            async for event in _parse_response(message.content or ""):
                yield event
            return

        # El modelo quiere usar herramientas
        if choice.finish_reason == "tool_calls" and message.tool_calls:
            messages.append(message.model_dump())

            for tool_call in message.tool_calls:
                tool_name = tool_call.function.name
                tool_args = json.loads(tool_call.function.arguments)

                yield {"type": "thinking", "content": _thinking_text(tool_name, tool_args)}

                result = await execute_tool(tool_name, tool_args, user_id)

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


async def _parse_response(content: str) -> AsyncGenerator[dict, None]:
    """Convierte la respuesta del agente en eventos SSE (texto + cards)."""
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
            event_type = "place_card" if card_type == "PLACE_CARD" else "event_card"
            yield {"type": event_type, "data": card_data}
        except json.JSONDecodeError:
            pass

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
