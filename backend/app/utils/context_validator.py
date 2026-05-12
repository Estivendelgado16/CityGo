import re

MEDELLIN_KEYWORDS = [
    "medellin", "medellín", "paisa", "antioquia", "colombia",
    "restaurante", "comida", "bar", "discoteca", "rumba", "fiesta",
    "cultura", "museo", "teatro", "galería", "galeria", "arte",
    "deporte", "deportivo", "gimnasio", "senderismo", "ciclismo",
    "evento", "concierto", "feria", "festival",
    "comer", "beber", "bailar", "visitar", "conocer",
    "recomendar", "recomendación", "recomendacion", "lugar", "plan",
    "tour", "turista", "turismo", "viaje", "viajero",
    "hacer", "salir", "hoy", "noche", "mañana", "semana", "finde",
    "poblado", "laureles", "centro", "envigado", "sabaneta", "bello",
    "precio", "económico", "economico", "caro", "presupuesto",
    "ambiente", "vista", "terraza", "rooftop", "parche", "plan",
    "comida", "gastronomía", "gastronomia", "cocina", "menu", "menú",
    "piscina", "mirador", "parque", "plaza", "iglesia", "museo",
    "pueblito", "guatapé", "guatape", "piedra", "peñol", "penol",
    "comuna", "grafiti", "graffiti", "metro", "cable",
    "helado", "café", "cafe", "arepa", "bandeja", "paisa",
    "dónde", "donde", "cuándo", "cuanto", "cómo", "como",
    "experiencia", "aventura", "ocio", "diversión", "relajarse",
    "amigo", "amigos", "familia", "pareja", "solo", "sola",
]

OUT_OF_CONTEXT_PATTERNS = [
    r"\b\d+\s*[+\-*/]\s*\d+",
    r"código\s*(python|java|php|js)",
    r"(cuánto|cuanto)\s*(pesa|mide|talla)",
    r"poema\b",
    r"(hora|hoy|ayer|mañana)\s*(en|del)\s*(ny|new\s*york|londres|parís|paris|tokyo|tokio)",
    r"qué\s*(piensas|opinas)\s*(de|sobre|acerca)",
]

NON_MEDELLIN_DESTINATIONS = [
    r"(en|de|del?|para)\s*(parís|paris|londres|tokio|tokyo|ny|new\s+york|madrid|barcelona|buenos\s+aires|méxico|mexico)",
]


def is_out_of_context(message: str) -> bool:
    msg_lower = message.lower().strip()

    for pattern in OUT_OF_CONTEXT_PATTERNS:
        if re.search(pattern, msg_lower):
            return True

    for pattern in NON_MEDELLIN_DESTINATIONS:
        if re.search(pattern, msg_lower):
            for kw in MEDELLIN_KEYWORDS:
                if kw in msg_lower:
                    return False
            return True

    for kw in MEDELLIN_KEYWORDS:
        if kw in msg_lower:
            return False

    return len(msg_lower) > 10
