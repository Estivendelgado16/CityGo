from app.services.supabase_client import get_supabase
from app.services.embedding_service import generate_embedding, search_events


async def execute_tool(tool_name: str, tool_args: dict, user_id: str) -> dict:
    """Ejecuta una herramienta del agente y devuelve el resultado."""

    if tool_name == "buscar_lugares":
        supabase = get_supabase()
        query_embedding = await generate_embedding(tool_args["query"])
        cat_filter = tool_args.get("categoria")
        if cat_filter == "todos":
            cat_filter = None

        response = supabase.rpc(
            "search_places_with_feedback",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.5,
                "match_count": tool_args.get("limit", 5),
                "category_filter": cat_filter,
                "feedback_weight": 0.5,
                "rating_weight": 0.3,
                "positive_feedback_weight": 0.2,
            },
        ).execute()

        results = response.data or []
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

    elif tool_name == "consultar_feedback_comunitario":
        supabase = get_supabase()
        response = (
            supabase.table("user_feedback")
            .select("rating, comment, visited_at, created_at")
            .eq("place_id", tool_args["place_id"])
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

    elif tool_name == "obtener_detalles_lugar":
        supabase = get_supabase()
        response = supabase.table("places").select("*").eq("id", tool_args["place_id"]).single().execute()
        return response.data or {"error": "Lugar no encontrado"}

    elif tool_name == "buscar_eventos_por_fecha":
        results = await search_events(
            query=f"eventos {tool_args.get('categoria', '')}",
            fecha_inicio=tool_args["fecha_inicio"],
            fecha_fin=tool_args["fecha_fin"],
            category=tool_args.get("categoria"),
        )
        return {
            "eventos_encontrados": len(results),
            "resultados": [{"event_id": str(r["event_id"]), "data": r["event_data"]} for r in results],
        }

    elif tool_name == "actualizar_preferencias_usuario":
        supabase = get_supabase()
        current = (
            supabase.table("user_preferences")
            .select("agent_detected_preferences")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        detected = current.data.get("agent_detected_preferences", {}) if current.data else {}
        detected[tool_args["preferencia_tipo"]] = tool_args["valor"]

        supabase.table("user_preferences").update({"agent_detected_preferences": detected}).eq("user_id", user_id).execute()

        return {"status": "preferencia actualizada", "tipo": tool_args["preferencia_tipo"], "valor": tool_args["valor"]}

    return {"error": f"Herramienta desconocida: {tool_name}"}
