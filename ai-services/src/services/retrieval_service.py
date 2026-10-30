"""Búsqueda vectorial en PostgreSQL con pgvector."""

import asyncio
import re
from collections.abc import Awaitable, Callable

import asyncpg
import structlog
from pgvector.asyncpg import register_vector

logger = structlog.get_logger(__name__)

# pgvector no puede indexar vectores de mas de 2000 dimensiones con HNSW
# (limite de la implementacion vector_cosine_ops). Con mas dimensiones el
# CREATE INDEX falla y la busqueda cae a un escaneo secuencial: sigue siendo
# correcta, pero se degrada con volumen. Por eso EMBEDDING_DIMENSIONS <= 2000.
HNSW_MAX_DIMENSIONS = 2000

EmbedDocuments = Callable[[list[str]], Awaitable[list[list[float]]]]


async def _init_connection(conn: asyncpg.Connection) -> None:
    await register_vector(conn)


class RetrievalService:
    """Acceso a la base vectorial de material educativo indexado."""

    def __init__(
        self,
        database_url: str,
        embedding_dimensions: int = 768,
        embed_documents: EmbedDocuments | None = None,
    ):
        self._database_url = database_url
        self._dimensions = embedding_dimensions
        # Callback opcional para reindexar si la tabla existia con otra dimension.
        self._embed_documents = embed_documents
        self._pool: asyncpg.Pool | None = None
        self._pool_lock = asyncio.Lock()

    async def _get_pool(self) -> asyncpg.Pool:
        async with self._pool_lock:
            if self._pool is None:
                await self._ensure_extension()
                pool = await asyncpg.create_pool(self._database_url, init=_init_connection)
                self._pool = pool
                try:
                    await self._init_schema()
                except Exception:
                    # Sin esto el pool quedaba creado con el esquema a medio
                    # migrar y no se volvia a intentar hasta reiniciar.
                    self._pool = None
                    await pool.close()
                    raise
        return self._pool

    async def _ensure_extension(self) -> None:
        conn = await asyncpg.connect(self._database_url)
        try:
            await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        finally:
            await conn.close()

    async def _init_schema(self) -> None:
        if self._pool is None:
            return
        # Todo en una transaccion: si el reindexado tras un cambio de dimension
        # falla, el DROP TABLE se revierte y no se pierde el material indexado.
        async with self._pool.acquire() as conn, conn.transaction():
            pendientes = await self._migrar_dimensiones(conn)
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
            await self._crear_indice_hnsw(conn)
            if pendientes:
                await self._reindexar(conn, pendientes)

    async def _dimension_actual(self, conn: asyncpg.Connection) -> int | None:
        tipo = await conn.fetchval(
            """
            SELECT format_type(atttypid, atttypmod)
            FROM pg_attribute
            WHERE attrelid = to_regclass('ai_materials')
              AND attname = 'embedding'
              AND NOT attisdropped
            """
        )
        if not tipo:
            return None
        match = re.search(r"\((\d+)\)", str(tipo))
        return int(match.group(1)) if match else None

    async def _migrar_dimensiones(self, conn: asyncpg.Connection) -> list[dict]:
        """Si la tabla existente usa otra dimension, la recrea y devuelve las
        filas (id, subject_id, material_id, chunk_index, content) para reindexar."""
        actual = await self._dimension_actual(conn)
        if actual is None or actual == self._dimensions:
            return []

        filas = await conn.fetch(
            "SELECT id, subject_id, material_id, chunk_index, content FROM ai_materials"
        )
        logger.warning(
            "embedding_dimensions_changed",
            dimension_anterior=actual,
            dimension_nueva=self._dimensions,
            filas=len(filas),
            detalle=(
                "Se recrea ai_materials con la nueva dimension y se reindexa el "
                "material (mismo texto, nuevos embeddings)."
            ),
        )
        await conn.execute("DROP TABLE ai_materials")
        return [dict(fila) for fila in filas]

    async def _crear_indice_hnsw(self, conn: asyncpg.Connection) -> None:
        try:
            # Savepoint: un fallo aca no debe abortar la transaccion del esquema.
            async with conn.transaction():
                await conn.execute(
                    "CREATE INDEX IF NOT EXISTS idx_ai_materials_embedding "
                    "ON ai_materials USING hnsw (embedding vector_cosine_ops)"
                )
        except Exception as exc:
            if self._dimensions > HNSW_MAX_DIMENSIONS:
                logger.warning(
                    "hnsw_index_unavailable",
                    error=str(exc),
                    dimensions=self._dimensions,
                    limite=HNSW_MAX_DIMENSIONS,
                    detalle=(
                        "pgvector no indexa vectores de mas de 2000 dimensiones con HNSW. "
                        "La busqueda sigue funcionando con escaneo secuencial, pero "
                        "conviene bajar EMBEDDING_DIMENSIONS (y reindexar el material) "
                        "o cambiar a un indice IVF para no perder performance."
                    ),
                )
            else:
                logger.warning("hnsw_index_unavailable", error=str(exc))

    async def _reindexar(self, conn: asyncpg.Connection, filas: list[dict]) -> None:
        if not filas:
            return
        if self._embed_documents is None:
            logger.warning(
                "reindex_pendiente",
                filas=len(filas),
                detalle="No hay embedder disponible; reindexar el material a mano.",
            )
            return
        vectores = await self._embed_documents([fila["content"] for fila in filas])
        if len(vectores) != len(filas):
            raise RuntimeError(
                f"Reindexado: {len(vectores)} vectores para {len(filas)} filas."
            )
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
                    fila["id"],
                    fila["subject_id"],
                    fila["material_id"],
                    fila["chunk_index"],
                    fila["content"],
                    vectores[index],
                )
                for index, fila in enumerate(filas)
            ],
        )
        logger.info("reindex_completado", filas=len(filas), dimensions=self._dimensions)

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

    async def search(
        self,
        subject_id: str,
        embedding: list[float],
        top_k: int = 5,
        min_score: float | None = None,
    ) -> list[dict]:
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
            results = [dict(row) for row in rows]
            if min_score is None or min_score <= 0.0:
                return results
            return [r for r in results if float(r.get("score", 0.0)) >= float(min_score)]

    async def close(self) -> None:
        if self._pool is not None:
            await self._pool.close()
            self._pool = None
