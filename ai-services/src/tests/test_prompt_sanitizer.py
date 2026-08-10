from src.services.prompt_sanitizer import sanitize_prompt


def test_removes_leading_greeting():
    cleaned, saved = sanitize_prompt("Hola, ¿qué es una variable?")
    assert cleaned.startswith("¿qué es una variable?")
    assert saved >= 0


def test_removes_filler_words():
    cleaned, _ = sanitize_prompt("Tipo, o sea, ¿cómo funciona el ciclo while?")
    assert "o sea" not in cleaned.lower()


def test_collapses_repeated_punctuation():
    cleaned, _ = sanitize_prompt("¿Cómo resuelvo esto???")
    assert "??" not in cleaned


def test_empty_prompt_returns_empty():
    cleaned, saved = sanitize_prompt("   ")
    assert cleaned == ""
    assert saved == 0


def test_pure_question_kept_intact():
    cleaned, saved = sanitize_prompt("¿Cuál es la fórmula del área del círculo?")
    assert cleaned == "¿Cuál es la fórmula del área del círculo?"
    assert saved == 0
