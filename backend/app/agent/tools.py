AGENT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "buscar_lugares",
            "description": "Busca lugares en Medellín por similitud semántica. Usa cuando necesites encontrar restaurantes, bares, eventos, sitios culturales o actividades deportivas.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Descripción en lenguaje natural. Ej: 'bar con terraza y vista a la ciudad, ambiente tranquilo'",
                    },
                    "categoria": {
                        "type": "string",
                        "enum": ["restaurante", "bar", "discoteca", "cultura", "deporte", "todos"],
                        "description": "Filtro por categoría. 'todos' si no se especificó.",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Máximo de resultados (default: 5)",
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "consultar_feedback_comunitario",
            "description": "Obtiene reseñas y calificaciones de otros usuarios sobre un lugar. Usa para validar recomendaciones con experiencias reales.",
            "parameters": {
                "type": "object",
                "properties": {
                    "place_id": {
                        "type": "string",
                        "description": "ID (UUID) del lugar. Lo obtienes de buscar_lugares.",
                    },
                },
                "required": ["place_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "obtener_detalles_lugar",
            "description": "Info detallada: menú, horarios, dirección, redes sociales. SOLO cuando el usuario pida explícitamente.",
            "parameters": {
                "type": "object",
                "properties": {
                    "place_id": {"type": "string", "description": "ID del lugar"},
                    "campos": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "enum": ["menu", "horarios", "direccion", "redes_sociales", "como_llegar", "todos"],
                        },
                        "description": "Campos que necesitas.",
                    },
                },
                "required": ["place_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "buscar_eventos_por_fecha",
            "description": "Busca eventos en Medellín en un rango de fechas. Usa cuando pregunten por planes para una fecha o rango.",
            "parameters": {
                "type": "object",
                "properties": {
                    "fecha_inicio": {"type": "string", "description": "YYYY-MM-DD"},
                    "fecha_fin": {"type": "string", "description": "YYYY-MM-DD"},
                    "categoria": {
                        "type": "string",
                        "enum": ["concierto", "fiesta", "cultural", "deportivo", "gastronomico", "todos"],
                    },
                },
                "required": ["fecha_inicio", "fecha_fin"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "actualizar_preferencias_usuario",
            "description": "Actualiza preferencias del usuario cuando detectes patrones recurrentes en la conversación.",
            "parameters": {
                "type": "object",
                "properties": {
                    "preferencia_tipo": {
                        "type": "string",
                        "enum": ["cocina_favorita", "rango_precio", "vibe_preferido", "zona_preferida", "otro"],
                    },
                    "valor": {"type": "string", "description": "Valor de la preferencia detectada"},
                },
                "required": ["preferencia_tipo", "valor"],
            },
        },
    },
]
