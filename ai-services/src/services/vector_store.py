"""Factory del vector store según la variable VECTOR_STORE (pgvector | pinecone)."""

from src.config.settings import settings
from src.services.pinecone_service import PineconeRetrievalService
from src.services.retrieval_service import RetrievalService


def build_retrieval_service() -> RetrievalService | PineconeRetrievalService:
    if settings.vector_store == "pinecone":
        if not settings.pinecone_api_key:
            raise RuntimeError(
                "VECTOR_STORE=pinecone requiere PINECONE_API_KEY en el entorno."
            )
        return PineconeRetrievalService(
            api_key=settings.pinecone_api_key,
            index_name=settings.pinecone_index,
            dimension=settings.embedding_dimensions,
            cloud=settings.pinecone_cloud,
            region=settings.pinecone_region,
            metric=settings.pinecone_metric,
        )
    if settings.vector_store != "pgvector":
        raise RuntimeError(
            f"VECTOR_STORE desconocido: {settings.vector_store!r} "
            "(valores válidos: pgvector, pinecone)."
        )
    return RetrievalService(settings.database_url, settings.embedding_dimensions)
