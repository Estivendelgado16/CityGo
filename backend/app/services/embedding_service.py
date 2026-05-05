from openai import AsyncOpenAI
from app.config import get_settings

settings = get_settings()
openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

EMBEDDING_MODEL = "text-embedding-3-small"


async def generate_embedding(text: str) -> list[float]:
    """Genera embedding para un texto usando OpenAI."""
    response = await openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text,
    )
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

    return response.data or []


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
