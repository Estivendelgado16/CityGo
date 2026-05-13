from app.utils.input_validator import (
    is_empty_message,
    is_valid_length,
    contains_abusive_language,
    has_spam_patterns,
)

def test_empty_message():
    assert is_empty_message("") is True
    assert is_empty_message("   ") is True
    assert is_empty_message("hola") is False
    assert is_empty_message(None) is True 

def test_valid_length():
    assert is_valid_length("hola") is True
    assert is_valid_length("") is False
    assert is_valid_length("a" * 600) is False
    assert is_valid_length("ho", min_length=1) is True

def test_abusive_language():
    assert contains_abusive_language("eres un hp") is True
    assert contains_abusive_language("Eres un IMBECIL") is True
    assert contains_abusive_language("hola parce") is False
    assert contains_abusive_language("") is False

def test_spam_patterns():
    assert has_spam_patterns("aaaaaaaaaaa") is True
    assert has_spam_patterns("normal text") is False
    assert has_spam_patterns("") is False
    