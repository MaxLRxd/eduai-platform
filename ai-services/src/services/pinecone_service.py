"""Búsqueda vectorial en Pinecone (serverless).

Misma interfaz que RetrievalService (pgvector) para poder elegir el
vector store con la variable VECTOR_STORE. Usa un namespace por subject_id
y guarda el texto del chunk en los metadatos de cada vector.
"""

import time

import structlog
from pinecone import NotFoundError, Pinecone, ServerlessSpec

logger = structlog.get_logger(__name__)

_UPSERT_BATCH_SIZE = 100


class PineconeRetrievalService:
    """Acceso a la base vectorial de material educativo indexado en Pinecone."""

    def __init__(
        self,
        api_key: str,
        index_name: str,
        dimension: int,
        cloud: str = "aws",
        region: str = "us-east-1",
        metric: str = "cosine",
    ):
        self._api_key = api_key
        self._index_name = index_name
        self._dimension = dimension
        self._cloud = cloud
        self._region = region
        self._metric = metric
        self._pc: Pinecone | None = None
        self._index = None

    def _ensure_index(self):
        if self._index is None:
            self._pc = Pinecone(api_key=self._api_key)
            existing = {index.name for index in self._pc.list_indexes()}
            if self._index_name not in existing:
                self._pc.create_index(
                    name=self._index_name,
                    dimension=self._dimension,
                    metric=self._metric,
                    spec=ServerlessSpec(cloud=self._cloud, region=self._region),
                )
                while not self._index_ready():
                    time.sleep(1)
                logger.info("pinecone_index_created", name=self._index_name)
            self._index = self._pc.Index(self._index_name)
        return self._index

    def _index_ready(self) -> bool:
        status = self._pc.describe_index(self._index_name).status
        if isinstance(status, dict):
            return bool(status.get("ready", False))
        return bool(getattr(status, "ready", False))

    async def upsert_chunks(
        self,
        subject_id: str,
        material_id: str,
        chunks: list[str],
        vectors: list[list[float]],
    ) -> None:
        index = self._ensure_index()
        records = [
            {
                "id": f"{material_id}:{chunk_index}",
                "values": vectors[chunk_index],
                "metadata": {
                    "subject_id": subject_id,
                    "material_id": material_id,
                    "chunk_index": chunk_index,
                    "text": chunks[chunk_index],
                },
            }
            for chunk_index in range(len(chunks))
        ]
        for batch_index in range(0, len(records), _UPSERT_BATCH_SIZE):
            index.upsert(
                vectors=records[batch_index : batch_index + _UPSERT_BATCH_SIZE],
                namespace=subject_id,
            )

    async def delete_material(self, subject_id: str, material_id: str) -> None:
        index = self._ensure_index()
        try:
            index.delete(filter={"material_id": material_id}, namespace=subject_id)
        except NotFoundError:
            logger.info(
                "pinecone_namespace_missing",
                namespace=subject_id,
                material_id=material_id,
            )

    async def search(self, subject_id: str, embedding: list[float], top_k: int = 5) -> list[dict]:
        index = self._ensure_index()
        response = index.query(
            vector=embedding,
            top_k=top_k,
            namespace=subject_id,
            include_metadata=True,
        )
        rows = []
        for match in response.matches:
            metadata = match.metadata or {}
            rows.append(
                {
                    "material_id": metadata.get("material_id", ""),
                    "chunk_index": int(metadata.get("chunk_index", -1)),
                    "content": metadata.get("text", ""),
                    "score": float(match.score),
                }
            )
        return rows

    async def close(self) -> None:
        if self._pc is not None:
            close = getattr(self._pc, "close", None)
            if callable(close):
                close()
            self._pc = None
            self._index = None
