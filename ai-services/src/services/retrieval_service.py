"""Búsqueda vectorial en PostgreSQL con pgvector."""

import asyncpg
import structlog
from pgvector.asyncpg import register_vector

logger = structlog.get_logger(__name__)


async def _init_connection(conn: asyncpg.Connection) -> None:
    await register_vector(conn)


class RetrievalService:
    """Acceso a la base vectorial de material educativo indexado."""

    def __init__(self, database_url: str, embedding_dimensions: int = 768):
        self._database_url = database_url
        self._dimensions = embedding_dimensions
        self._pool: asyncpg.Pool | None = None

    async def _get_pool(self) -> asyncpg.Pool:
        if self._pool is None:
            self._pool = await asyncpg.create_pool(self._database_url, init=_init_connection)
            await self._init_schema()
        return self._pool

    async def _init_schema(self) -> None:
        if self._pool is None:
            return
        async with self._pool.acquire() as conn:
            await conn.execute(
                "CREATE EXTENSION IF NOT EXISTS vector"
            )
            await conn.execute(
                f"""
                CREATE TABLE IF NOT EXISTS ai_materials (
                    id TEXT PRIMARY KEY,
                    subject_id TEXT NOT NULL,
                    material_id TEXT NOT NULL,
                    chunk_index INT NOT NULL,
                    content TEXT NOT NULL,
                    embedding vector({self._dimensions}) NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
                """
            )
            await conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_ai_materials_subject "
                "ON ai_materials (subject_id)"
            )
            try:
                await conn.execute(
                    "CREATE INDEX IF NOT EXISTS idx_ai_materials_embedding "
                    "ON ai_materials USING hnsw (embedding vector_cosine_ops)"
                )
            except Exception as exc:
                logger.warning("hnsw_index_unavailable", error=str(exc))

    async def upsert_chunks(
        self,
        subject_id: str,
        material_id: str,
        chunks: list[str],
        vectors: list[list[float]],
    ) -> None:
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            async with conn.transaction():
                await conn.executemany(
                    """
                    INSERT INTO ai_materials
                        (id, subject_id, material_id, chunk_index, content, embedding)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (id) DO UPDATE
                    SET content = EXCLUDED.content, embedding = EXCLUDED.embedding
                    """,
                    [
                        (
                            f"{material_id}:{index}",
                            subject_id,
                            material_id,
                            index,
                            chunks[index],
                            vectors[index],
                        )
                        for index in range(len(chunks))
                    ],
                )

    async def delete_material(self, subject_id: str, material_id: str) -> None:
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "DELETE FROM ai_materials WHERE subject_id = $1 AND material_id = $2",
                subject_id,
                material_id,
            )

    async def search(self, subject_id: str, embedding: list[float], top_k: int = 5) -> list[dict]:
        pool = await self._get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT material_id, chunk_index, content,
                       1 - (embedding <=> $2::vector) AS score
                FROM ai_materials
                WHERE subject_id = $1
                ORDER BY embedding <=> $2::vector
                LIMIT $3
                """,
                subject_id,
                embedding,
                top_k,
            )
            return [dict(row) for row in rows]

    async def close(self) -> None:
        if self._pool is not None:
            await self._pool.close()
            self._pool = None
