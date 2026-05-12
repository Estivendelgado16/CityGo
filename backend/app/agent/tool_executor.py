import re
from datetime import date

from app.services.supabase_client import get_supabase
from app.services.embedding_service import generate_embedding, search_events

_UUID_RE = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    re.IGNORECASE,
)
_DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')

_VALID_PLACE_CATEGORIES = {"restaurante", "bar", "discoteca", "cultura", "deporte", "todos"}
_VALID_EVENT_CATEGORIES = {"concierto", "fiesta", "cultural", "deportivo", "gastronomico", "todos"}


def _is_valid_uuid(value: str) -> bool:
    return bool(_UUID_RE.match(value or ""))


def _is_valid_date(value: str) -> bool:
    if not _DATE_RE.match(value or ""):
        return False
    try:
        date.fromisoformat(value)
        return True
    except ValueError:
        return False


async def execute_tool(tool_name: str, tool_args: dict, user_id: str) -> dict:
    """Ejecuta una herramienta del agente y devuelve el resultado."""
    try:
        if tool_name == "buscar_lugares":
            return await _buscar_lugares(tool_args)
        elif tool_name == "consultar_feedback_comunitario":
            return await _consultar_feedback(tool_args)
        elif tool_name == "obtener_detalles_lugar":
            return await _obtener_detalles(tool_args)
        elif tool_name == "buscar_eventos_por_fecha":
            return await _buscar_eventos(tool_args)
        elif tool_name == "actualizar_preferencias_usuario":
            return await _actualizar_preferencias(tool_args, user_id)

        return {"error": f"Herramienta desconocida: {tool_name}"}

    except Exception as e:
        return {"error": str(e), "tool": tool_name}


async def _buscar_lugares(args: dict) -> dict:
    query = (args.get("query") or "").strip()
    if not query:
        return {"error": "El campo 'query' es requerido y no puede estar vacío."}

    limit = args.get("limit", 5)
    if not isinstance(limit, int) or not (1 <= limit <= 10):
        limit = 5

    categoria = args.get("categoria", "todos")
    if categoria not in _VALID_PLACE_CATEGORIES:
        categoria = "todos"

    cat_filter = None if categoria == "todos" else categoria

    supabase = get_supabase()
    query_embedding = await generate_embedding(query)

    response = supabase.rpc(
        "search_places_with_feedback",
        {
            "query_embedding": query_embedding,
            "match_threshold": 0.5,
            "match_count": limit,
            "category_filter": cat_filter,
            "feedback_weight": 0.5,
            "rating_weight": 0.3,
            "positive_feedback_weight": 0.2,
        },
    ).execute()

    results = response.data or []

    if not results:
        return {
            "lugares_encontrados": 0,
            "resultados": [],
            "sugerencia": "No encontré lugares con esos criterios. Prueba con una categoría más amplia o palabras diferentes.",
        }

    return {
        "lugares_encontrados": len(results),
        "resultados": [
            {
                "place_id": str(r["place_id"]),
                "name": r["place_name"],
                "data": r["place_data"],
                "relevancia": round(float(r["similarity"]), 3),
                "feedback_comunitario": r["community_feedback"],
            }
            for r in results
        ],
    }


async def _consultar_feedback(args: dict) -> dict:
    place_id = args.get("place_id", "")
    if not _is_valid_uuid(place_id):
        return {"error": "place_id inválido. Debe ser un UUID obtenido de buscar_lugares."}

    supabase = get_supabase()
    response = (
        supabase.table("user_feedback")
        .select("rating, comment, visited_at, created_at")
        .eq("place_id", place_id)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    feedback = response.data or []
    avg_rating = sum(f["rating"] for f in feedback) / len(feedback) if feedback else 0

    return {
        "total_reseñas": len(feedback),
        "calificación_promedio": round(avg_rating, 1),
        "reseñas": feedback,
    }


async def _obtener_detalles(args: dict) -> dict:
    place_id = args.get("place_id", "")
    if not _is_valid_uuid(place_id):
        return {"error": "place_id inválido. Debe ser un UUID obtenido de buscar_lugares."}

    supabase = get_supabase()
    response = supabase.table("places").select("*").eq("id", place_id).single().execute()
    return response.data or {"error": "Lugar no encontrado"}


async def _buscar_eventos(args: dict) -> dict:
    fecha_inicio = args.get("fecha_inicio", "")
    fecha_fin = args.get("fecha_fin", "")

    if not _is_valid_date(fecha_inicio):
        return {"error": "fecha_inicio inválida. Usa formato YYYY-MM-DD."}
    if not _is_valid_date(fecha_fin):
        return {"error": "fecha_fin inválida. Usa formato YYYY-MM-DD."}
    if fecha_inicio > fecha_fin:
        return {"error": "fecha_inicio no puede ser posterior a fecha_fin."}

    categoria = args.get("categoria", "todos")
    if categoria not in _VALID_EVENT_CATEGORIES:
        categoria = "todos"

    results = await search_events(
        query=f"eventos {categoria}",
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        category=categoria if categoria != "todos" else None,
    )

    return {
        "eventos_encontrados": len(results),
        "resultados": [
            {"event_id": str(r["event_id"]), "data": r["event_data"]}
            for r in results
        ],
    }


async def _actualizar_preferencias(args: dict, user_id: str) -> dict:
    valor = (args.get("valor") or "").strip()
    if not valor:
        return {"error": "El campo 'valor' no puede estar vacío."}
    if len(valor) > 100:
        return {"error": "El valor de la preferencia es demasiado largo (máx 100 caracteres)."}

    supabase = get_supabase()
    current = (
        supabase.table("user_preferences")
        .select("agent_detected_preferences")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    detected = current.data.get("agent_detected_preferences", {}) if current.data else {}
    detected[args["preferencia_tipo"]] = valor

    supabase.table("user_preferences").update(
        {"agent_detected_preferences": detected}
    ).eq("user_id", user_id).execute()

    return {"status": "preferencia actualizada", "tipo": args["preferencia_tipo"], "valor": valor}
