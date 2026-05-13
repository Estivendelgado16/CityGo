import time
import logging
from openai import AsyncOpenAI
from app.config import get_settings

logger = logging.getLogger("citygo.rag")

EMBEDDING_MODEL = "text-embedding-3-small"


async def generate_embedding(text: str) -> list[float]:
    """Genera embedding para un texto usando OpenAI."""
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    start = time.perf_counter()
    response = await client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text,
    )
    ms = round((time.perf_counter() - start) * 1000)
    logger.info("rag.embedding_generated",
                extra={"text_len": len(text), "latency_ms": ms})
    return response.data[0].embedding


async def search_places(
    query: str,
    category: str | None = None,
    limit: int = 5,
    threshold: float | None = None,
) -> list[dict]:
    """
    Búsqueda semántica de lugares.
    Genera embedding de la query → busca en pgvector → devuelve resultados con feedback.
    Los pesos de feedback/rating/positividad son configurables vía .env (US-16).
    """
    from app.services.supabase_client import get_supabase

    rag_settings = get_settings()
    if threshold is None:
        threshold = rag_settings.RAG_MATCH_THRESHOLD

    feedback_weight = max(0.0, rag_settings.RAG_FEEDBACK_WEIGHT)
    rating_weight = max(0.0, rag_settings.RAG_RATING_WEIGHT)
    positive_feedback_weight = max(0.0, rag_settings.RAG_POSITIVE_FEEDBACK_WEIGHT)

    logger.info("rag.search_start",
                extra={"query_preview": query[:80], "category": category,
                       "limit": limit, "threshold": threshold})
    search_start = time.perf_counter()
    query_embedding = await generate_embedding(query)
    supabase = get_supabase()

    cat_filter = category if category and category != "todos" else None

    rpc_payload = {
        "query_embedding": query_embedding,
        "match_threshold": threshold,
        "match_count": limit,
        "category_filter": cat_filter,
        "feedback_weight": feedback_weight,
        "rating_weight": rating_weight,
    }
    if positive_feedback_weight > 0:
        rpc_payload["positive_feedback_weight"] = positive_feedback_weight

    response = supabase.rpc("search_places_with_feedback", rpc_payload).execute()
    results = response.data or []
    ms = round((time.perf_counter() - search_start) * 1000)
    logger.info("rag.search_done",
                extra={"results_count": len(results), "latency_ms": ms})
    return results


async def search_events(
    query: str,
    fecha_inicio: str,
    fecha_fin: str,
    category: str | None = None,
    limit: int = 5,
) -> list[dict]:
    """Búsqueda de eventos por similitud + filtro de fecha."""
    from app.services.supabase_client import get_supabase

    query_embedding = await generate_embedding(query)
    supabase = get_supabase()

    cat_filter = category if category and category != "todos" else None

    response = supabase.rpc(
        "search_events_by_date_and_similarity",
        {
            "query_embedding": query_embedding,
            "start_date": fecha_inicio,
            "end_date": fecha_fin,
            "category_filter": cat_filter,
            "match_count": limit,
        },
    ).execute()

    return response.data or []
