"""Caso de uso CU-A05: resumen estructurado de un documento del alumno."""

from src.prompts.summary import build_summary_prompt
from src.services.chunking_service import ChunkingService
from src.services.llm_service import LLMService


class ResumirDocumentoUseCase:
    def __init__(self, llm: LLMService, chunking: ChunkingService):
        self.llm = llm
        self.chunking = chunking

    async def execute(self, text: str, language: str = "es", max_words: int = 150) -> str:
        chunks = self.chunking.chunk_text(text, max_tokens=800)
        if not chunks:
            raise ValueError("El documento no contiene texto legible para resumir.")

        if len(chunks) == 1:
            return await self._summarize(chunks[0], language, max_words)

        part_summaries: list[str] = []
        for chunk in chunks:
            part_summaries.append(await self._part_summary(chunk, language))

        combined = "\n".join(part_summaries)
        return await self._summarize(combined, language, max_words)

    async def _part_summary(self, text: str, language: str) -> str:
        system = (
            f"Sos el tutor IA de EduAI. Resumí el fragmento en ideas principales con viñetas. "
            f"Escribí en el idioma '{language}' y no agregues información que no esté en el texto."
        )
        return await self.llm.generate(
            system,
            [{"role": "user", "content": text[:12000]}],
            temperature=0.3,
            max_tokens=800,
        )

    async def _summarize(self, text: str, language: str, max_words: int) -> str:
        system = build_summary_prompt(language=language, max_words=max_words)
        return await self.llm.generate(
            system,
            [{"role": "user", "content": text[:12000]}],
            temperature=0.3,
            max_tokens=max_words * 4 + 400,
        )
