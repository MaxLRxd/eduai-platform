"""Depuración de prompts de usuario (CU-SYS01)."""

import re

from src.services.chunking_service import estimate_tokens

_GREETINGS = (
    "buenos dias",
    "buenas tardes",
    "buenas noches",
    "buen dia",
    "buena tarde",
    "buena noche",
    "hola",
    "holi",
    "hey",
    "oye",
    "hello",
    "hi",
    "disculpa",
    "disculpe",
    "perdon",
    "perdona",
)

_FILLERS_RE = re.compile(
    r"\b(este|esto|estoo|o sea|osea|digamos|por asi decirlo|tipo|"
    r"como que|eh|em|um|mmm|ajá|ya veo)\b",
    re.IGNORECASE,
)
_REPEATED_CHARS_RE = re.compile(r"(.)\1{2,}")
_REPEATED_PUNCT_RE = re.compile(r"([!?.,])\1+")


def _strip_leading_greeting(text: str) -> str:
    lower = text.lower()
    for greeting in _GREETINGS:
        if lower.startswith(greeting):
            rest = text[len(greeting) :]
            return rest.lstrip(" .,!?;:-").strip()
    return text


def sanitize_prompt(prompt: str) -> tuple[str, int]:
    """Elimina saludos, muletillas y contenido irrelevante.

    Devuelve (prompt_depurado, tokens_ahorrados).
    """
    original = prompt.strip()
    if not original:
        return original, 0

    tokens_before = estimate_tokens(original)

    cleaned = original
    cleaned = _FILLERS_RE.sub(" ", cleaned)
    cleaned = _REPEATED_CHARS_RE.sub(r"\1", cleaned)
    cleaned = _REPEATED_PUNCT_RE.sub(r"\1", cleaned)
    cleaned = _strip_leading_greeting(cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    tokens_after = estimate_tokens(cleaned)
    return cleaned, max(0, tokens_before - tokens_after)
