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

# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------
async def _reset_tables():
    """Limpia las tablas usadas en los tests (solo entorno de desarrollo)."""
    supabase = get_supabase()
    # Borrado simple (no se usan triggers aquí)
    supabase.table("user_feedback").delete().gt("created_at", "1970-01-01").execute()
    supabase.table("places").delete().gt("created_at", "1970-01-01").execute()

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
    supabase.table("user_feedback").insert({
        "id": str(uuid.uuid4()),
        "place_id": place_id,
        "rating": rating,
        "comment": comment,
        "visited_at": "2023-01-01",
        "embedding": embedding,
    }).execute()

# ----------------------------------------------------------------------
# Tests
# ----------------------------------------------------------------------
@pytest.mark.asyncio
async def test_rag_ranking():
    # Reset DB state
    await _reset_tables()

    # 1️⃣ Insertamos dos lugares: uno con buen rating y feedback, otro sin feedback
    place_good = await _insert_place(
        name="Buen Restaurante",
        rating=4.8,
        total_reviews=20,
        text="Restaurante de alta cocina con platos innovadores y servicio excepcional.",
    )
    await _insert_feedback(place_good, rating=5, comment="Me encantó la comida, ambiente genial.")

    place_bad = await _insert_place(
        name="Resto Normal",
        rating=2.5,
        total_reviews=5,
        text="Restaurante sencillo, comida típica, sin mucho detalle.",
    )
    # No feedback for this place

    # 2️⃣ Ejecutamos la búsqueda RAG con una query típica
    results = await search_places(
        query="restaurante con comida innovadora y buen ambiente",
        category=None,
        limit=5,
        threshold=None,
    )

    # 3️⃣ Validamos el orden esperado
    assert len(results) >= 2, "Se esperaban al menos 2 resultados"
    first = results[0]
    second = results[1]

    assert first["place_name"] == "Buen Restaurante", "El lugar con mejor rating y feedback debe aparecer primero"
    assert second["place_name"] == "Resto Normal", "El lugar sin feedback debe quedar después"

    assert first["similarity"] > second["similarity"], "El score del primero debe ser mayor"

# ----------------------------------------------------------------------
# Ejecutar con: pytest -q tests/test_rag.py
# ----------------------------------------------------------------------
