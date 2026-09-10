"""Caso de uso CU-A13: corrección automática de entregas con rúbrica (Auto-correction Engine)."""

import json
import re

from src.config.settings import settings
from src.prompts.correccion import SYSTEM_PROMPT as CORRECCION_PROMPT
from src.schemas.tutor import CorrectSubmissionRequest
from src.services.embeddings_service import EmbeddingsService
from src.services.llm_service import LLMService
from src.services.retrieval_service import RetrievalService
from src.use_cases._helpers import format_context

DEFAULT_RUBRICA = [
    {"nombre": "Recuperación del contenido", "peso": 40},
    {"nombre": "Claridad y organización", "peso": 30},
    {"nombre": "Cumplimiento de la consigna", "peso": 30},
]


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

        rubrica = [{"nombre": c.nombre, "peso": c.peso} for c in req.rubrica] or DEFAULT_RUBRICA
        rubrica_txt = "\n".join(f"- {c['nombre']} (peso {c['peso']}%)" for c in rubrica)

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
