"""Caso de uso CU-A13: corrección automática de entregas con rúbrica (Auto-correction Engine)."""

import json
import re

from src.config.settings import settings
from src.prompts.correccion import SYSTEM_PROMPT as CORRECCION_PROMPT
from src.schemas.tutor import CorrectSubmissionRequest, CriterioRubrica
from src.services.embeddings_service import EmbeddingsService
from src.services.llm_service import LLMService
from src.services.retrieval_service import RetrievalService
from src.use_cases._helpers import format_context

DEFAULT_RUBRICA = [
    {
        "nombre": "Recuperación del contenido",
        "peso": 40,
        "esperado": "Define correctamente los conceptos principales de la consigna.",
    },
    {
        "nombre": "Claridad y organización",
        "peso": 30,
        "esperado": "La respuesta se entiende, esta ordenada y no se contradice.",
    },
    {
        "nombre": "Cumplimiento de la consigna",
        "peso": 30,
        "esperado": "Responde todo lo que la consigna pide, sin salirse del tema.",
    },
]


def _peso_legible(peso: float) -> str:
    """60.0 -> '60', 62.5 -> '62.5'. El modelo no necesita decimales de relleno."""
    return str(int(peso)) if float(peso).is_integer() else str(peso)


def _formatear_rubrica(criterios: list) -> str:
    lineas = []
    for c in criterios:
        linea = f"- {c.nombre} (peso {_peso_legible(c.peso)}%)"
        esperado = (getattr(c, "esperado", "") or "").strip()
        if esperado:
            linea += f"\n    Esperado: {esperado}"
        lineas.append(linea)
    return "\n".join(lineas)


class CorreccionEntregaUseCase:
    def __init__(
        self,
        llm: LLMService,
        embeddings: EmbeddingsService,
        retrieval: RetrievalService,
    ):
        self.llm = llm
        self.embeddings = embeddings
        self.retrieval = retrieval

    async def execute(self, req: CorrectSubmissionRequest) -> dict:
        query = " ".join([req.consigna, req.entrega])
        embedding = await self.embeddings.embed_query(query)
        results = await self.retrieval.search(req.subject_id, embedding, settings.retrieval_top_k)
        context = format_context(results)

        rubrica = list(req.rubrica) or [
            CriterioRubrica(**c) for c in DEFAULT_RUBRICA
        ]
        rubrica_txt = _formatear_rubrica(rubrica)

        user_content = (
            f"CONSIGNA DE LA ACTIVIDAD:\n{req.consigna or '(sin consigna cargada)'}\n\n"
            f"ENTREGA DEL ALUMNO:\n{req.entrega[:12000]}\n\n"
            f"RÚBRICA:\n{rubrica_txt}\n\n"
            f"CONTEXTO (material de la cátedra):\n"
            f"{context or '(no hay material indexado disponible para esta materia)'}\n\n"
            f"Devolvé únicamente el JSON."
        )
        raw = await self.llm.generate(
            CORRECCION_PROMPT,
            [{"role": "user", "content": user_content}],
            temperature=0.2,
            max_tokens=2048,
        )
        return self._parse(raw)

    def _parse(self, raw: str) -> dict:
        cleaned = raw.strip()
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if start == -1 or end == -1:
            raise ValueError("El modelo no devolvió un JSON válido para la corrección.")
        payload = json.loads(cleaned[start : end + 1])

        feedback = str(payload.get("feedback", "")).strip()
        if not feedback:
            raise ValueError("El modelo no devolvió feedback para la corrección.")

        calificacion = max(0.0, min(10.0, float(payload.get("calificacion", 0))))
        return {"feedback": feedback, "calificacion": round(calificacion, 2)}
