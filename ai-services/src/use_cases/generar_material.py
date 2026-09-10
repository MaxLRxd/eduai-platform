"""Caso de uso CU-A09: generación de material didáctico para el docente (asistente IA)."""

from src.config.settings import settings
from src.prompts.material import SYSTEM_PROMPT as MATERIAL_PROMPT
from src.services.embeddings_service import EmbeddingsService
from src.services.llm_service import LLMService
from src.services.retrieval_service import RetrievalService
from src.use_cases._helpers import build_sources, format_context


class GenerarMaterialUseCase:
    def __init__(
        self,
        llm: LLMService,
        embeddings: EmbeddingsService,
        retrieval: RetrievalService,
    ):
        self.llm = llm
        self.embeddings = embeddings
        self.retrieval = retrieval

    async def execute(self, subject_id: str, prompt: str) -> dict:
        embedding = await self.embeddings.embed_query(prompt)
        results = await self.retrieval.search(subject_id, embedding, settings.retrieval_top_k)
        sources = build_sources(results)
        context = format_context(results)

        user_content = (
            f"Pedido del docente:\n{prompt}\n\n"
            f"CONTEXTO (material de la cátedra):\n"
            f"{context or '(no hay material indexado disponible para esta materia)'}"
        )
        material = await self.llm.generate(
            MATERIAL_PROMPT,
            [{"role": "user", "content": user_content}],
            temperature=0.6,
            max_tokens=4096,
        )
        return {"material": material, "sources": sources}
