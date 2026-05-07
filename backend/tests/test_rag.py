# tests/test_rag.py
"""
Tests for the RAG search pipeline (Semana 2 – P3).

- Verifica que la función `search_places` devuelve resultados ordenados
  por similitud + peso de feedback + rating.
- Usa datos de ejemplo insertados directamente en Supabase (tablas `places`
  y `user_feedback`).
- Comprueba que un lugar con rating alto y feedback positivo aparece
  antes que un lugar sin feedback.
"""

import asyncio
import uuid

import pytest
from app.services.supabase_client import get_supabase
from app.services.embedding_service import search_places, generate_embedding

pytestmark = pytest.mark.integration

# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------


async def _insert_place(name: str, rating: float, total_reviews: int, text: str):
    """Inserta un registro en `places` con embedding generado a partir de `text`."""
    embedding = await generate_embedding(text)
    supabase = get_supabase()
    data = {
        "id": str(uuid.uuid4()),
        "name": name,
        "category": "restaurante",
        "description": text,
        "short_description": text[:120],
        "address": "Test address",
        "zone": "Test zone",
        "price_range": "$",
        "vibe_tags": ["test"],
        "average_rating": rating,
        "total_reviews": total_reviews,
        "embedding": embedding,
        "is_active": True,
    }
    supabase.table("places").insert(data).execute()
    return data["id"]

async def _insert_feedback(place_id: str, rating: int, comment: str):
    """Inserta feedback asociado a un `place_id`."""
    embedding = await generate_embedding(comment)
    supabase = get_supabase()
    data = {
        "id": str(uuid.uuid4()),
        "place_id": place_id,
        "rating": rating,
        "comment": comment,
        "visited_at": "2023-01-01",
        "embedding": embedding,
    }
    supabase.table("user_feedback").insert(data).execute()
    return data["id"]

# ----------------------------------------------------------------------
# Tests
# ----------------------------------------------------------------------
@pytest.mark.asyncio
async def test_rag_ranking():
    created_places = []
    created_feedbacks = []
    
    try:
        # Generate a unique suffix to avoid constraint violations
        suffix = uuid.uuid4().hex[:6]
        
        # Insertamos dos lugares: uno con buen rating y feedback, otro sin feedback
        place_good_name = f"Buen Restaurante {suffix}"
        place_good = await _insert_place(
            name=place_good_name,
            rating=4.8,
            total_reviews=20,
            text="Restaurante de alta cocina con platos innovadores y servicio excepcional.",
        )
        created_places.append(place_good)
        
        fb_id = await _insert_feedback(place_good, rating=5, comment="Me encantó la comida, ambiente genial.")
        created_feedbacks.append(fb_id)

        place_bad_name = f"Resto Normal {suffix}"
        place_bad = await _insert_place(
            name=place_bad_name,
            rating=2.5,
            total_reviews=5,
            text="Restaurante sencillo, comida típica, sin mucho detalle.",
        )
        created_places.append(place_bad)
        # No feedback for this place

        # Ejecutamos la búsqueda RAG con una query típica
        results = await search_places(
            query="restaurante con comida innovadora y buen ambiente",
            category=None,
            limit=5,
            threshold=None,
        )

        # Validamos el orden esperado
        assert len(results) >= 1, "Se esperaba al menos 1 resultado"
        test_results = [r for r in results if r["place_id"] in created_places]
        assert len(test_results) >= 1, "No se encontraron los lugares de prueba en los resultados"
        first = test_results[0]
        assert first["place_name"] == place_good_name, "El lugar con mejor rating debe aparecer primero"
        if len(test_results) >= 2:
            second = test_results[1]
            assert second["place_name"] == place_bad_name
            assert first["similarity"] > second["similarity"]
        
    finally:
        # Cleanup: Borrar solo la data creada por este test
        supabase = get_supabase()
        if created_feedbacks:
            supabase.table("user_feedback").delete().in_("id", created_feedbacks).execute()
        if created_places:
            supabase.table("places").delete().in_("id", created_places).execute()

# ----------------------------------------------------------------------
# Ejecutar con: pytest -q tests/test_rag.py
# ----------------------------------------------------------------------
