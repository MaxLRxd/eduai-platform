"""Caso de uso CU-A08: generación de simulacros de examen basados en el material."""

import json
import re

from src.config.settings import settings
from src.prompts.exam import SYSTEM_PROMPT as EXAM_PROMPT
from src.schemas.tutor import ExamRequest, ExamResponse
from src.services.embeddings_service import EmbeddingsService
from src.services.llm_service import LLMService
from src.services.retrieval_service import RetrievalService
from src.use_cases._helpers import format_context


class GenerarExamenUseCase:
    def __init__(
        self,
        llm: LLMService,
        embeddings: EmbeddingsService,
        retrieval: RetrievalService,
    ):
        self.llm = llm
        self.embeddings = embeddings
        self.retrieval = retrieval

    async def execute(self, req: ExamRequest) -> ExamResponse:
        embedding = await self.embeddings.embed_query(
            "contenido de la materia para elaborar un examen"
        )
        results = await self.retrieval.search(req.subject_id, embedding, settings.retrieval_top_k)
        context = format_context(results)

        user_content = (
            f"Generá un simulacro de examen con {req.n_questions} preguntas "
            f"de dificultad {req.dificultad}.\n\n"
            f"CONTEXTO (material de la cátedra):\n"
            f"{context or '(no hay material indexado disponible para esta materia)'}\n\n"
            f"Devolvé únicamente el JSON."
        )
        raw = await self.llm.generate(
            EXAM_PROMPT,
            [{"role": "user", "content": user_content}],
            temperature=0.5,
            max_tokens=4096,
        )
        return self._parse_exam(raw, req)

    def _parse_exam(self, raw: str, req: ExamRequest) -> ExamResponse:
        cleaned = raw.strip()
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if start == -1 or end == -1:
            raise ValueError("El modelo no devolvió un JSON válido para el simulacro.")
        payload = json.loads(cleaned[start : end + 1])
        return ExamResponse(**payload)
