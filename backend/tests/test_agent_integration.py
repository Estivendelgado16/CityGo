# tests/test_agent_integration.py
"""
Tests de integración del agente - Semana 3 P3

Validan:
1. Que el agente llama `actualizar_preferencias_usuario` cuando el usuario
   menciona gustos explícitos.
2. Que el historial de conversación se usa en respuestas subsiguientes.
3. Que `agent_detected_preferences` se persiste correctamente en Supabase.

Usan mocks para no consumir tokens de OpenAI en cada ejecución de CI.
"""

import json
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.agent.agent_loop import agent_loop
from app.agent.tool_executor import execute_tool


# ---------------------------------------------------------------------------
# Test 1: La herramienta actualizar_preferencias_usuario persiste en Supabase
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_actualizar_preferencias_persiste():
    """
    Verifica que execute_tool('actualizar_preferencias_usuario') escribe
    correctamente en la tabla user_preferences de Supabase.
    """
    user_id = str(uuid.uuid4())

    mock_supabase = MagicMock()
    # Simular que no hay preferencias previas
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
        "agent_detected_preferences": {}
    }
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()

    with patch("app.services.supabase_client.get_supabase", return_value=mock_supabase):
        result = await execute_tool(
            tool_name="actualizar_preferencias_usuario",
            tool_args={"preferencia_tipo": "vibe_preferido", "valor": "tranquilo y con buena música"},
            user_id=user_id,
        )

    assert result["status"] == "preferencia actualizada"
    assert result["tipo"] == "vibe_preferido"
    assert result["valor"] == "tranquilo y con buena música"

    # Verificar que se llamó a update con el nuevo valor
    update_call_args = mock_supabase.table.return_value.update.call_args[0][0]
    assert "agent_detected_preferences" in update_call_args
    assert update_call_args["agent_detected_preferences"]["vibe_preferido"] == "tranquilo y con buena música"


# ---------------------------------------------------------------------------
# Test 2: Las preferencias previas no se sobreescriben, se combinan
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_actualizar_preferencias_combina_existentes():
    """
    Si ya hay preferencias detectadas, la nueva preferencia se agrega
    sin borrar las anteriores.
    """
    user_id = str(uuid.uuid4())

    mock_supabase = MagicMock()
    # Preferencias previas ya guardadas
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
        "agent_detected_preferences": {"cocina_favorita": "japonesa"}
    }
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()

    with patch("app.services.supabase_client.get_supabase", return_value=mock_supabase):
        result = await execute_tool(
            tool_name="actualizar_preferencias_usuario",
            tool_args={"preferencia_tipo": "zona_preferida", "valor": "El Poblado"},
            user_id=user_id,
        )

    update_call_args = mock_supabase.table.return_value.update.call_args[0][0]
    merged = update_call_args["agent_detected_preferences"]

    # Debe conservar la preferencia anterior
    assert merged.get("cocina_favorita") == "japonesa"
    # Y añadir la nueva
    assert merged.get("zona_preferida") == "El Poblado"


# ---------------------------------------------------------------------------
# Test 3: El agente llama a actualizar_preferencias cuando el usuario
#          menciona un gusto explícito (mock del LLM)
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_agent_detecta_preferencia_en_mensaje():
    """
    Simula una respuesta del LLM que incluye una tool_call a
    `actualizar_preferencias_usuario` cuando el usuario dice que
    le gusta la comida italiana.
    """
    user_id = str(uuid.uuid4())
    conversation_id = str(uuid.uuid4())

    # Simular la respuesta del LLM con una tool_call
    tool_call_mock = MagicMock()
    tool_call_mock.id = "call_abc123"
    tool_call_mock.function.name = "actualizar_preferencias_usuario"
    tool_call_mock.function.arguments = json.dumps({
        "preferencia_tipo": "cocina_favorita",
        "valor": "italiana"
    })

    first_response = MagicMock()
    first_response.choices[0].finish_reason = "tool_calls"
    first_response.choices[0].message.tool_calls = [tool_call_mock]
    first_response.choices[0].message.content = None
    first_response.choices[0].message.model_dump.return_value = {
        "role": "assistant", "content": None, "tool_calls": []
    }

    # Segunda respuesta: el agente termina con texto
    second_response = MagicMock()
    second_response.choices[0].finish_reason = "stop"
    second_response.choices[0].message.content = "¡Bacano! Ya tomé nota de que te encanta la comida italiana."
    second_response.choices[0].message.tool_calls = None

    mock_openai = AsyncMock()
    mock_openai.chat.completions.create = AsyncMock(side_effect=[first_response, second_response])

    mock_supabase = MagicMock()
    # Preferencias del usuario (vacías al inicio)
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
        "agent_detected_preferences": {}
    }
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()
    # Chat history vacío
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = []

    events = []
    with patch("app.agent.agent_loop.openai_client", mock_openai), \
         patch("app.services.supabase_client._supabase_client", mock_supabase):
        async for event in agent_loop(
            user_message="Me encanta la comida italiana, ¿qué me recomiendas?",
            user_id=user_id,
            conversation_id=conversation_id,
        ):
            events.append(event)

    # Verificar que el agente emitió la herramienta de preferencias
    thinking_events = [e for e in events if e.get("type") == "thinking"]
    assert any("Anotando" in e.get("content", "") for e in thinking_events), \
        "El agente debió emitir un evento 'thinking' al guardar preferencias"

    # Verificar que hay al menos un texto de respuesta final
    text_events = [e for e in events if e.get("type") == "text_delta"]
    assert len(text_events) > 0, "El agente debió responder con texto"


# ---------------------------------------------------------------------------
# Test 4: El historial de conversación se incluye en el contexto del agente
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_agente_usa_historial_conversacion():
    """
    Verifica que si hay mensajes previos en la conversación,
    se pasan correctamente al LLM (el agente tiene memoria).
    """
    user_id = str(uuid.uuid4())
    conversation_id = str(uuid.uuid4())

    historial_simulado = [
        {"role": "user", "content": "Busco un restaurante vegano"},
        {"role": "assistant", "content": "Te recomiendo Verdeo en El Poblado."},
    ]

    simple_response = MagicMock()
    simple_response.choices[0].finish_reason = "stop"
    simple_response.choices[0].message.content = "¿Quieres algo diferente hoy, parce?"
    simple_response.choices[0].message.tool_calls = None

    mock_openai = AsyncMock()
    mock_openai.chat.completions.create = AsyncMock(return_value=simple_response)

    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {}
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = historial_simulado

    with patch("app.agent.agent_loop.openai_client", mock_openai), \
         patch("app.services.supabase_client._supabase_client", mock_supabase):
        async for _ in agent_loop(
            user_message="¿Recuerdas lo que busqué antes?",
            user_id=user_id,
            conversation_id=conversation_id,
        ):
            pass

    # Verificar que el historial se incluyó en los mensajes enviados al LLM
    llamada_llm = mock_openai.chat.completions.create.call_args
    messages_enviados = llamada_llm.kwargs.get("messages", [])

    roles_en_contexto = [m["role"] for m in messages_enviados if isinstance(m, dict)]
    assert "user" in roles_en_contexto
    assert "assistant" in roles_en_contexto, \
        "El historial previo (rol assistant) debió incluirse en el contexto del agente"
