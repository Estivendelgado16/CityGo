import json
import pytest
from app.agent.agent_loop import _parse_response, _thinking_text
from app.prompts.system_prompt import build_system_prompt, format_preferences

# ===== _parse_response tests =====
@pytest.mark.asyncio
async def test_parse_response_plain_text():
    events = []
    async for event in _parse_response("Hola, te recomiendo estos lugares"):
        events.append(event)
    assert all(e["type"] == "text_delta" for e in events)

@pytest.mark.asyncio
async def test_parse_response_with_place_card():
    content = 'Te recomiendo [PLACE_CARD:{"place_id":"123","name":"Test","rating":4.5}] este lugar'
    events = []
    async for event in _parse_response(content):
        events.append(event)
    types = [e["type"] for e in events]
    assert "place_card" in types
    assert "text_delta" in types
    card_event = next(e for e in events if e["type"] == "place_card")
    assert card_event["data"]["place_id"] == "123"
    assert card_event["data"]["name"] == "Test"

@pytest.mark.asyncio
async def test_parse_response_with_event_card():
    content = 'Evento: [EVENT_CARD:{"event_id":"e1","name":"Concierto","category":"concierto"}]'
    events = []
    async for event in _parse_response(content):
        events.append(event)
    types = [e["type"] for e in events]
    assert "event_card" in types
    assert "text_delta" in types
    card_event = next(e for e in events if e["type"] == "event_card")
    assert card_event["data"]["event_id"] == "e1"

@pytest.mark.asyncio
async def test_parse_response_multiple_cards():
    content = (
        'Lugares: [PLACE_CARD:{"place_id":"1","name":"A"}] y [PLACE_CARD:{"place_id":"2","name":"B"}]'
    )
    events = []
    async for event in _parse_response(content):
        events.append(event)
    cards = [e for e in events if e["type"] == "place_card"]
    assert len(cards) == 2
    assert cards[0]["data"]["place_id"] == "1"
    assert cards[1]["data"]["place_id"] == "2"

@pytest.mark.asyncio
async def test_parse_response_malformed_json():
    content = 'Mira esto [PLACE_CARD:{bad json}] que tal'
    events = []
    async for event in _parse_response(content):
        events.append(event)
    assert all(e["type"] == "text_delta" for e in events)

@pytest.mark.asyncio
async def test_parse_response_card_only():
    content = '[PLACE_CARD:{"place_id":"1","name":"Solo"}]'
    events = []
    async for event in _parse_response(content):
        events.append(event)
    assert len(events) == 1
    assert events[0]["type"] == "place_card"

@pytest.mark.asyncio
async def test_parse_response_empty():
    events = []
    async for event in _parse_response(""):
        events.append(event)
    assert len(events) == 0

@pytest.mark.asyncio
async def test_parse_response_words_split():
    content = 'Ve a [PLACE_CARD:{"place_id":"1","name":"X"}] ahora'
    events = []
    async for event in _parse_response(content):
        events.append(event)
    text_events = [e for e in events if e["type"] == "text_delta"]
    assert len(text_events) >= 2

# ===== _thinking_text tests =====
def test_thinking_text_buscar_lugares():
    result = _thinking_text("buscar_lugares", {"categoria": "restaurante"})
    assert "restaurante" in result
    assert result == "Buscando restaurante en Medellín..."

def test_thinking_text_buscar_lugares_default():
    result = _thinking_text("buscar_lugares", {})
    assert "lugares" in result
    assert result == "Buscando lugares en Medellín..."

def test_thinking_text_unknown_tool():
    result = _thinking_text("tool_unknown", {})
    assert result == "Buscando información..."

def test_thinking_text_all_tools():
    tools = {
        "buscar_lugares": {"categoria": "bares"},
        "consultar_feedback_comunitario": {"place_id": "x"},
        "obtener_detalles_lugar": {"place_id": "x"},
        "buscar_eventos_por_fecha": {"fecha_inicio": "2026-01-01"},
        "actualizar_preferencias_usuario": {"preferencia_tipo": "cocina_favorita"},
    }
    for tool, args in tools.items():
        result = _thinking_text(tool, args)
        assert isinstance(result, str)
        assert len(result) > 0


# ===== format_preferences tests =====
def test_format_preferences_empty():
    result = format_preferences({})
    assert "No hay preferencias guardadas aún" in result

def test_format_preferences_with_values():
    prefs = {
        "budget_range": "$$",
        "favorite_cuisines": ["japonesa", "italiana"],
        "preferred_vibes": ["tranquilo"],
    }
    result = format_preferences(prefs)
    assert "Presupuesto preferido: $$" in result
    assert "Cocinas favoritas: japonesa, italiana" in result
    assert "Ambientes preferidos: tranquilo" in result

def test_format_preferences_detected():
    prefs = {
        "agent_detected_preferences": {"cocina_favorita": "mexicana"}
    }

    result = format_preferences(prefs)
    assert "detectado automáticamente" in result
    assert "mexicana" in result
def test_format_preferences_all_empty():
    result = format_preferences({"budget_range": "", "favorite_cuisines": []})
    assert "Preferencias básicas, aún sin personalizar" in result


# ===== build_system_prompt tests =====
def test_build_system_prompt_contains_name():
    result = build_system_prompt({})
    assert "Parcero" in result

def test_build_system_prompt_includes_preferences():
    prefs = {"budget_range": "$$$"}
    result = build_system_prompt(prefs)
    assert "$$$" in result

def test_build_system_prompt_has_rules():
    result = build_system_prompt({})
    assert "buscar_lugares" in result
    assert "PLACE_CARD" in result
    assert "EVENT_CARD" in result