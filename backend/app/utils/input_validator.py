import re

#Validación de mensajes vacíos
def is_empty_message(message:str) -> bool:
    if not isinstance(message, str):
        return True
    
    return not message.strip()


#Validar longitud
def is_valid_length(
        message: str,
        min_length: int = 2,
        max_length: int = 500
) -> bool:
    length = len(message.strip())
    return min_length <= length <= max_length

#Palabras abusivas
BANNED_WORDS = [
    "hp",
    "gonorrea",
    "idiota",
    "malparido",
    "estupido",
    "feo",
    "marica",
    "imbecil"

]

def contains_abusive_language(message: str) -> bool:
    message = message.lower()

    return any(
        word in message
        for word in BANNED_WORDS
    )

#Detectamos spam simple
def has_spam_patterns(message: str) -> bool:
    repeated_chars = re.search(r"(.)\1{6,}", message)

    return repeated_chars is not None
