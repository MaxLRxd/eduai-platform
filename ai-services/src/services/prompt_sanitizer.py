"""Depuración de prompts de usuario (CU-SYS01)."""

import re
from dataclasses import dataclass
from typing import Literal

import structlog

from src.services.chunking_service import estimate_tokens

logger = structlog.get_logger()

_GREETINGS = (
    "buenos dias",
    "buenos días",
    "buenas tardes",
    "buenas noches",
    "buen dia",
    "buen día",
    "buenas",
    "buenos",
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
    "perdón",
    "perdona",
)

# Cortesías que acompañan al saludo ("hola, ¿cómo estás?"): solo se quitan al comienzo.
_COURTESY_RE = re.compile(
    r"^[¿\s]*(c[oó]mo\s+(est[aá]s|est[aá]n|and[aá]s|te\s+va|and[aá]n)|qu[eé]\s+tal)\b[?\s!.,]*",
    re.IGNORECASE,
)

# "este", "esto" y "tipo" son muletillas solo cuando titubean ("este...", "tipo,"); en
# "este ejercicio" o "preguntas tipo examen" son parte de la consulta y no se tocan.
_HESITATION_RE = re.compile(r"\b(este|esto|estoo|tipo)\b(?=\s*(?:\.\.\.|…|,))", re.IGNORECASE)
_FILLERS_RE = re.compile(
    r"\b(o sea|osea|digamos|por asi decirlo|por así decirlo|"
    r"como que|eh|em|um|mmm|ajá|ya veo)\b",
    re.IGNORECASE,
)
_REPEATED_CHARS_RE = re.compile(r"(.)\1{2,}")
_REPEATED_PUNCT_RE = re.compile(r"([!?.,])\1+")
_LEADING_PUNCT_RE = re.compile(r"^[\s,;:.\-]+")

EstadoPrompt = Literal["ok", "saludo", "vacio"]

RESPUESTA_SALUDO = (
    "¡Hola! Contame qué querés consultar o repasar de la materia y te ayudo con el material "
    "cargado."
)
RESPUESTA_VACIO = (
    "No pude identificar una consulta en tu mensaje. ¿Podés reformularla con más detalle?"
)


@dataclass(frozen=True)
class PromptDepurado:
    texto: str
    tokens_ahorrados: int
    estado: EstadoPrompt

    @property
    def respuesta_directa(self) -> str | None:
        """Respuesta sin consumir tokens del LLM cuando no hay nada que consultar (A4/A4.1)."""
        if self.estado == "saludo":
            return RESPUESTA_SALUDO
        if self.estado == "vacio":
            return RESPUESTA_VACIO
        return None


def _matches_greeting(lower: str, greeting: str) -> bool:
    """Prefijo con limite de palabra: "hi" saluda, "historia" no."""
    return lower.startswith(greeting) and not (
        len(lower) > len(greeting) and lower[len(greeting)].isalnum()
    )


def _starts_with_greeting(text: str) -> bool:
    lower = text.strip().lower().lstrip("¡¿ ")
    return any(_matches_greeting(lower, greeting) for greeting in _GREETINGS)


def _strip_leading_greeting(text: str) -> str:
    """Quita saludos encadenados al comienzo ("hola, buenas tardes, ...")."""
    while True:
        body = text.lstrip("¡ ")
        lower = body.lower()
        for greeting in _GREETINGS:
            if _matches_greeting(lower, greeting):
                text = body[len(greeting) :].lstrip(" .,!?;:-").strip()
                break
        else:
            return text


def _normalize_whitespace(text: str) -> str:
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"[ \t]*\n[ \t]*", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def sanitize_prompt(prompt: str) -> tuple[str, int]:
    """Elimina saludos, muletillas y contenido irrelevante.

    Devuelve (prompt_depurado, tokens_ahorrados).
    """
    original = prompt.strip()
    if not original:
        return original, 0

    tokens_before = estimate_tokens(original)

    cleaned = original
    cleaned = _HESITATION_RE.sub(" ", cleaned)
    cleaned = _FILLERS_RE.sub(" ", cleaned)
    cleaned = _REPEATED_CHARS_RE.sub(r"\1", cleaned)
    cleaned = _REPEATED_PUNCT_RE.sub(r"\1", cleaned)
    cleaned = _LEADING_PUNCT_RE.sub("", cleaned)
    cleaned = _strip_leading_greeting(cleaned)
    cleaned = _COURTESY_RE.sub("", cleaned) if _starts_with_greeting(original) else cleaned
    cleaned = _LEADING_PUNCT_RE.sub("", cleaned)
    cleaned = _normalize_whitespace(cleaned)

    tokens_after = estimate_tokens(cleaned)
    return cleaned, max(0, tokens_before - tokens_after)


def depurar(prompt: str) -> PromptDepurado:
    """Depura el prompt y clasifica el resultado para decidir si se llama al LLM.

    Ante un error del depurador se usa el prompt original sin depurar (A5), para no
    interrumpir al usuario.
    """
    original = prompt.strip()
    try:
        cleaned, saved = sanitize_prompt(original)
    except Exception as exc:  # noqa: BLE001 - el depurador nunca debe cortar la consulta
        logger.error("depuracion_prompt_fallo", error=str(exc))
        return PromptDepurado(original, 0, "ok" if original else "vacio")

    if cleaned:
        return PromptDepurado(cleaned, saved, "ok")
    return PromptDepurado("", saved, "saludo" if _starts_with_greeting(original) else "vacio")
