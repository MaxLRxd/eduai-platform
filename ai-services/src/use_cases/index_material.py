"""Caso de uso del pipeline RAG: indexación de materiales de la cátedra."""

import structlog

from src.services.chunking_service import ChunkingService
from src.services.embeddings_service import EmbeddingsService
from src.services.retrieval_service import RetrievalService

logger = structlog.get_logger(__name__)


class IndexMaterialUseCase:
    def __init__(
        self,
        chunking: ChunkingService,
        embeddings: EmbeddingsService,
        retrieval: RetrievalService,
    ):
        self.chunking = chunking
        self.embeddings = embeddings
        self.retrieval = retrieval

    async def execute(self, subject_id: str, material_id: str, text: str) -> dict:
        chunks = self.chunking.chunk_text(text)
        if not chunks:
            raise ValueError("No se pudo extraer texto del material para indexar.")

        logger.info("indexado_inicio", material_id=material_id, chunks=len(chunks))

        # Se embebe ANTES de borrar el indice anterior: si Gemini falla, el
        # material viejo sigue disponible para el tutor.
        vectors = await self.embeddings.embed_documents(chunks)
        if len(vectors) != len(chunks):
            raise RuntimeError(
                f"El embedder devolvio {len(vectors)} vectores para {len(chunks)} chunks."
            )

        await self.retrieval.delete_material(subject_id, material_id)
        await self.retrieval.upsert_chunks(subject_id, material_id, chunks, vectors)

        logger.info("indexado_completo", material_id=material_id, chunks=len(chunks))
        return {"material_id": material_id, "chunks": len(chunks), "indexed": True}
