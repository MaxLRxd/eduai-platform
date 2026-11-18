"""Caso de uso CU-A11: corrección de un simulacro de examen respondido por el alumno."""

import json
import re

import structlog

from src.config.settings import settings
from src.prompts.correccion_examen import SYSTEM_PROMPT as CORRECCION_EXAMEN_PROMPT
from src.schemas.tutor import (
    CorrectExamRequest,
    CorrectExamResponse,
    ExamAnswerItem,
    ExamItemResult,
)
from src.services.llm_service import LLMService
from src.services.prompt_sanitizer import sanitize_prompt
from src.services.texto import limpiar_markdown
from src.use_cases._helpers import format_context

logger = structlog.get_logger(__name__)

MAX_CARACTERES_RESPUESTA = 4000
VEREDICTOS_VALIDOS = {"correcta", "parcial", "incorrecta"}


def _normalizar(texto: str) -> str:
    return re.sub(r"\s+", " ", texto.strip().lower()).rstrip(".")


def _opcion_elegida(item: ExamAnswerItem) -> str:
    """Acepta la opción completa o su letra ("b", "b)") y la devuelve normalizada."""
    respuesta = _normalizar(item.respuesta_alumno)
    letra = re.fullmatch(r"([a-z])\)?", respuesta)
    if letra and item.opciones:
        indice = ord(letra.group(1)) - ord("a")
        if 0 <= indice < len(item.opciones):
            return _normalizar(item.opciones[indice])
    return respuesta


def _corregir_multiple_choice(indice: int, item: ExamAnswerItem) -> ExamItemResult:
    correcta = _normalizar(item.respuesta_modelo)
    if _opcion_elegida(item) == correcta:
        return ExamItemResult(
            indice=indice, veredicto="correcta", puntaje=1.0, feedback="Respuesta correcta."
        )
    return ExamItemResult(
        indice=indice,
        veredicto="incorrecta",
        puntaje=0.0,
        feedback=f"Respuesta incorrecta. La opción correcta era: {item.respuesta_modelo}.",
    )


def _limpiar_respuesta(texto: str) -> str:
    """CU-SYS01: se depura el texto; si la depuración lo vaciara se conserva el original."""
    recortado = texto.strip()[:MAX_CARACTERES_RESPUESTA]
    try:
        depurado, _ = sanitize_prompt(recortado)
    except Exception:  # noqa: BLE001 - nunca debe frenar la corrección
        return recortado
    return depurado or recortado


class CorregirSimulacroUseCase:
    def __init__(self, llm: LLMService, embeddings=None, retrieval=None):
        self.llm = llm
        # Opcionales: sin ellos la correccion solo puede comparar contra la respuesta modelo.
        self.embeddings = embeddings
        self.retrieval = retrieval

    async def _contexto(self, subject_id: str, enunciado: str) -> str:
        """Fragmentos del material de la materia relacionados con la pregunta ("" si no hay)."""
        if self.embeddings is None or self.retrieval is None:
            return ""
        try:
            embedding = await self.embeddings.embed_query(enunciado)
            resultados = await self.retrieval.search(
                subject_id, embedding, settings.retrieval_top_k, settings.retrieval_min_score
            )
        except Exception:  # noqa: BLE001 - sin contexto se corrige igual, avisando que es limitada
            logger.warning("correccion_contexto_no_disponible", subject_id=subject_id)
            return ""
        return format_context(resultados)

    async def execute(self, req: CorrectExamRequest) -> CorrectExamResponse:
        resultados: dict[int, ExamItemResult] = {}
        desarrollo: list[tuple[int, ExamAnswerItem]] = []

        for indice, item in enumerate(req.items):
            if item.tipo == "multiple_choice" and not item.respuesta_modelo.strip():
                raise ValueError(
                    f"La pregunta {indice + 1} es de opción múltiple y no tiene la opción correcta."
                )
            if not item.respuesta_alumno.strip():
                resultados[indice] = ExamItemResult(
                    indice=indice,
                    veredicto="sin_responder",
                    puntaje=0.0,
                    feedback="No respondiste esta pregunta.",
                )
            elif item.tipo == "multiple_choice":
                resultados[indice] = _corregir_multiple_choice(indice, item)
            else:
                desarrollo.append((indice, item))

        material_limitado = False
        if desarrollo:
            corregidas, material_limitado = await self._corregir_desarrollo(
                desarrollo, req.subject_id, req.material_referencia
            )
            resultados.update(corregidas)

        return CorrectExamResponse(
            resultados=[resultados[i] for i in range(len(req.items))],
            material_limitado=material_limitado,
        )

    async def _corregir_desarrollo(
        self,
        pendientes: list[tuple[int, ExamAnswerItem]],
        subject_id: str = "",
        material_referencia: str = "",
    ) -> tuple[dict[int, ExamItemResult], bool]:
        bloques = []
        material_limitado = False
        for indice, item in pendientes:
            bloque = (
                f"PREGUNTA (indice {indice}): {item.enunciado}\n"
                f"RESPUESTA MODELO: {item.respuesta_modelo or '(no disponible)'}\n"
                f"RESPUESTA DEL ALUMNO: {_limpiar_respuesta(item.respuesta_alumno)}"
            )
            if not item.respuesta_modelo.strip():
                # Pregunta propia del alumno: no hay respuesta modelo, la referencia es el material.
                contexto = await self._contexto(subject_id, item.enunciado)
                if material_referencia.strip():
                    elegido = (
                        "[Fuente: material elegido por el alumno]\n"
                        f"{material_referencia.strip()}"
                    )
                    contexto = f"{elegido}\n\n{contexto}" if contexto else elegido
                if contexto:
                    bloque += f"\nMATERIAL DE LA CÁTEDRA:\n{contexto}"
                else:
                    bloque += "\nMATERIAL DE LA CÁTEDRA: (no se encontró material de la materia)"
                    material_limitado = True
            bloques.append(bloque)
        user_content = "\n\n".join(bloques) + "\n\nDevolvé únicamente el JSON."

        raw = await self.llm.generate(
            CORRECCION_EXAMEN_PROMPT,
            [{"role": "user", "content": user_content}],
            temperature=0.2,
            max_tokens=2048,
        )
        parseados = self._parsear(raw)

        esperados = {indice for indice, _ in pendientes}
        faltantes = esperados - parseados.keys()
        if faltantes:
            raise ValueError(
                f"El modelo no corrigió todas las preguntas (faltan: {sorted(faltantes)})."
            )
        return {indice: parseados[indice] for indice in esperados}, material_limitado

    @staticmethod
    def _parsear(raw: str) -> dict[int, ExamItemResult]:
        limpio = re.sub(r"^```(?:json)?", "", raw.strip()).strip()
        limpio = re.sub(r"```$", "", limpio).strip()
        inicio, fin = limpio.find("{"), limpio.rfind("}")
        if inicio == -1 or fin == -1:
            raise ValueError("El modelo no devolvió un JSON válido para la corrección.")

        payload = json.loads(limpio[inicio : fin + 1])
        resultados: dict[int, ExamItemResult] = {}
        for fila in payload.get("resultados", []):
            veredicto = str(fila.get("veredicto", "")).strip().lower()
            if veredicto not in VEREDICTOS_VALIDOS:
                veredicto = "incorrecta"
            puntaje = max(0.0, min(1.0, float(fila.get("puntaje", 0))))
            indice = int(fila["indice"])
            resultados[indice] = ExamItemResult(
                indice=indice,
                veredicto=veredicto,
                puntaje=round(puntaje, 2),
                feedback=limpiar_markdown(str(fila.get("feedback", ""))) or "Sin comentarios.",
            )
        return resultados
