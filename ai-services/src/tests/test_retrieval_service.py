"""Tests del esquema/índice de pgvector y de la migración por dimensiones."""

from src.services.retrieval_service import RetrievalService


class FakeConn:
    def __init__(self):
        self.executed: list = []
        self.fetchval_result = None
        self.fetch_result: list = []
        self.executemany_calls: list = []

    async def execute(self, sql, *args):
        self.executed.append(sql)

    async def fetch(self, sql, *args):
        return self.fetch_result

    async def fetchval(self, sql, *args):
        return self.fetchval_result

    async def executemany(self, sql, rows):
        self.executemany_calls.append((sql, list(rows)))

    def transaction(self):
        conn = self

        class _Tx:
            async def __aenter__(self):
                conn.executed.append("BEGIN")

            async def __aexit__(self, exc_type, *exc):
                conn.executed.append("ROLLBACK" if exc_type else "COMMIT")
                return False

        return _Tx()


class FakePool:
    def __init__(self, conn):
        self._conn = conn

    def acquire(self):
        conn = self._conn

        class _Ctx:
            async def __aenter__(self):
                return conn

            async def __aexit__(self, *exc):
                return False

        return _Ctx()


def _sql(conn: FakeConn) -> str:
    return "\n".join(s for s in conn.executed if isinstance(s, str))


async def test_crea_tabla_con_dimension_configurada_e_indice_hnsw():
    conn = FakeConn()
    service = RetrievalService("postgresql://x", 1536)
    service._pool = FakePool(conn)

    await service._init_schema()

    sql = _sql(conn)
    assert "vector(1536)" in sql
    assert "USING hnsw (embedding vector_cosine_ops)" in sql


async def test_no_migra_si_la_dimension_coincide():
    conn = FakeConn()
    conn.fetchval_result = "vector(1536)"
    service = RetrievalService("postgresql://x", 1536)
    service._pool = FakePool(conn)

    await service._init_schema()

    assert "DROP TABLE" not in _sql(conn)
    assert conn.executemany_calls == []


async def test_migra_y_reindexa_si_cambia_la_dimension():
    conn = FakeConn()
    conn.fetchval_result = "vector(3072)"
    conn.fetch_result = [
        {"id": "m:0", "subject_id": "s", "material_id": "m", "chunk_index": 0, "content": "texto"}
    ]
    embedidos: list = []

    async def embed_documents(texts):
        embedidos.append(list(texts))
        return [[0.1] * 1536 for _ in texts]

    service = RetrievalService("postgresql://x", 1536, embed_documents=embed_documents)
    service._pool = FakePool(conn)

    await service._init_schema()

    assert "DROP TABLE" in _sql(conn)
    assert "vector(1536)" in _sql(conn)
    assert embedidos == [["texto"]]
    assert len(conn.executemany_calls) == 1
    assert conn.executemany_calls[0][1][0][0] == "m:0"


async def test_si_el_reindexado_falla_la_migracion_se_revierte():
    conn = FakeConn()
    conn.fetchval_result = "vector(3072)"
    conn.fetch_result = [
        {"id": "m:0", "subject_id": "s", "material_id": "m", "chunk_index": 0, "content": "a"},
        {"id": "m:1", "subject_id": "s", "material_id": "m", "chunk_index": 1, "content": "b"},
    ]

    async def embed_documents(texts):
        # Simula gemini-embedding-2 agregando todo en un solo vector.
        return [[0.1] * 1536]

    service = RetrievalService("postgresql://x", 1536, embed_documents=embed_documents)
    service._pool = FakePool(conn)

    try:
        await service._init_schema()
    except RuntimeError:
        pass
    else:
        raise AssertionError("debia fallar")

    assert conn.executed[-1] == "ROLLBACK"
    assert conn.executemany_calls == []
