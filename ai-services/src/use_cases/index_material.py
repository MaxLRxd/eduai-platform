"""Caso de uso del pipeline RAG: indexación de materiales de la cátedra."""

from src.services.chunking_service import ChunkingService
from src.services.embeddings_service import EmbeddingsService
from src.services.retrieval_service import RetrievalService


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

        await self.retrieval.delete_material(subject_id, material_id)
        vectors = await self.embeddings.embed_documents(chunks)
        await self.retrieval.upsert_chunks(subject_id, material_id, chunks, vectors)
        return {"material_id": material_id, "chunks": len(chunks), "indexed": True}
