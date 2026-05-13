# tests/test_rag_regression.py
"""
Tests de regresión del pipeline RAG – Semana 4 P3.

Objetivo: verificar que los cambios de logging en embedding_service.py
y agent_loop.py NO alteraron el comportamiento funcional del RAG.

Usan mocks para no consumir tokens de OpenAI ni conectarse a Supabase.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.embedding_service import generate_embedding, search_places


# ---------------------------------------------------------------------------
# Test 1: generate_embedding sigue devolviendo una lista de floats
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_generate_embedding_returns_list():
    """
    Verifica que generate_embedding devuelve una lista de floats
    después de añadir el logging de latencia (no altera el return).
    """
    fake_vector = [0.1, 0.2, 0.3]

    mock_response = MagicMock()
    mock_response.data[0].embedding = fake_vector

    mock_client = AsyncMock()
    mock_client.embeddings.create = AsyncMock(return_value=mock_response)

    with patch("app.services.embedding_service.AsyncOpenAI", return_value=mock_client):
        result = await generate_embedding("restaurante con terraza en Medellín")

    assert isinstance(result, list), "generate_embedding debe devolver una lista"
    assert result == fake_vector, "El embedding devuelto no coincide con el esperado"


# ---------------------------------------------------------------------------
# Test 2: search_places devuelve la lista de resultados sin modificarla
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_search_places_returns_results_unchanged():
    """
    Verifica que search_places devuelve exactamente los datos de Supabase
    sin alterarlos, aunque ahora haya logs alrededor.
    """
    fake_results = [
        {"place_id": "abc-123", "place_name": "El Cielo", "similarity": 0.92,
         "place_data": {}, "community_feedback": []},
        {"place_id": "def-456", "place_name": "Carmen", "similarity": 0.85,
         "place_data": {}, "community_feedback": []},
    ]

    mock_embedding = [0.1] * 1536  # vector de dimensión correcta

    mock_supabase = MagicMock()
    mock_supabase.rpc.return_value.execute.return_value.data = fake_results

    with patch("app.services.embedding_service.generate_embedding",
               AsyncMock(return_value=mock_embedding)), \
         patch("app.services.supabase_client.get_supabase",
               return_value=mock_supabase):
        results = await search_places(query="restaurant with view", limit=5)

    assert results == fake_results, "search_places no debe modificar los resultados de Supabase"
    assert len(results) == 2


# ---------------------------------------------------------------------------
# Test 3: search_places retorna lista vacía cuando Supabase no devuelve datos
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_search_places_empty_results():
    """
    Verifica que search_places maneja correctamente el caso donde
    Supabase devuelve None (sin resultados).
    """
    mock_embedding = [0.0] * 1536

    mock_supabase = MagicMock()
    mock_supabase.rpc.return_value.execute.return_value.data = None

    with patch("app.services.embedding_service.generate_embedding",
               AsyncMock(return_value=mock_embedding)), \
         patch("app.services.supabase_client.get_supabase",
               return_value=mock_supabase):
        results = await search_places(query="algo inexistente")

    assert results == [], "Debe devolver lista vacía si Supabase no retorna datos"


# ---------------------------------------------------------------------------
# Test 4: search_places pasa los pesos correctos a Supabase RPC
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_search_places_passes_weights_to_rpc():
    """
    Verifica que los pesos de RAG configurados en settings se pasan
    correctamente al RPC de Supabase (regresión tras cambios de logging).
    """
    mock_embedding = [0.5] * 1536

    mock_supabase = MagicMock()
    mock_supabase.rpc.return_value.execute.return_value.data = []

    mock_settings = MagicMock()
    mock_settings.RAG_MATCH_THRESHOLD = 0.3
    mock_settings.RAG_FEEDBACK_WEIGHT = 0.15
    mock_settings.RAG_RATING_WEIGHT = 0.10
    mock_settings.RAG_POSITIVE_FEEDBACK_WEIGHT = 0.0
    mock_settings.OPENAI_API_KEY = "test-key"

    with patch("app.services.embedding_service.generate_embedding",
               AsyncMock(return_value=mock_embedding)), \
         patch("app.services.supabase_client.get_supabase",
               return_value=mock_supabase), \
         patch("app.services.embedding_service.get_settings",
               return_value=mock_settings):
        await search_places(query="bar tranquilo", limit=3)

    rpc_call_args = mock_supabase.rpc.call_args
    assert rpc_call_args is not None, "supabase.rpc debe haber sido llamado"

    rpc_name = rpc_call_args.args[0]
    rpc_payload = rpc_call_args.args[1]

    assert rpc_name == "search_places_with_feedback"
    assert rpc_payload["match_threshold"] == 0.3
    assert rpc_payload["feedback_weight"] == 0.15
    assert rpc_payload["rating_weight"] == 0.10
    assert rpc_payload["match_count"] == 3
