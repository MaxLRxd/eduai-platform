"""Tests del embedding por chunk (gemini-embedding-2 agrega los contents)."""

import asyncio

import pytest

from src.services.embeddings_service import EmbeddingsService

_sleep_real = asyncio.sleep


class _Embedding:
    def __init__(self, values):
        self.values = values


class _Respuesta:
    def __init__(self, embeddings):
        self.embeddings = embeddings


class _ClienteFalso:
    def __init__(self, errores=None, vectores_por_llamada=1):
        self.errores = list(errores or [])
        self.vectores_por_llamada = vectores_por_llamada
        self.contents: list = []
        self.aio = self
        self.models = self

    async def embed_content(self, model, contents, config):
        # Cede el control como lo haria la llamada HTTP real.
        await _sleep_real(0)
        if self.errores:
            raise self.errores.pop(0)
        self.contents.append(contents)
        valor = float(len(self.contents))
        return _Respuesta([_Embedding([valor, 0.0])] * self.vectores_por_llamada)


@pytest.fixture(autouse=True)
def _sin_espera(monkeypatch):
    async def _rapido(_segundos):
        return None

    monkeypatch.setattr(asyncio, "sleep", _rapido)


def _service(cliente) -> EmbeddingsService:
    service = EmbeddingsService()
    service._client = cliente
    return service


async def test_un_vector_por_chunk_en_orden():
    cliente = _ClienteFalso()
    service = _service(cliente)

    textos = [f"chunk {i}" for i in range(25)]
    vectores = await service.embed_documents(textos)

    assert len(vectores) == 25
    # Cada chunk se mando en su propia llamada, nunca como lista.
    assert sorted(cliente.contents) == sorted(textos)
    assert all(isinstance(c, str) for c in cliente.contents)


async def test_reintenta_ante_429():
    cliente = _ClienteFalso(errores=[Exception("429 RESOURCE_EXHAUSTED")] * 2)
    service = _service(cliente)

    vectores = await service.embed_documents(["a"])

    assert len(vectores) == 1


async def test_no_reintenta_errores_permanentes():
    cliente = _ClienteFalso(errores=[Exception("400 INVALID_ARGUMENT")])
    service = _service(cliente)

    with pytest.raises(Exception, match="400"):
        await service.embed_documents(["a"])
    assert cliente.contents == []


async def test_falla_si_el_modelo_no_devuelve_un_vector():
    service = _service(_ClienteFalso(vectores_por_llamada=0))

    with pytest.raises(RuntimeError, match="0 vectores"):
        await service.embed_documents(["a"])


async def test_un_fallo_definitivo_cancela_el_resto_de_los_chunks():
    cliente = _ClienteFalso(errores=[Exception("400 INVALID_ARGUMENT")])
    service = _service(cliente)
    service.concurrency = 1

    with pytest.raises(Exception, match="400"):
        await service.embed_documents([f"chunk {i}" for i in range(20)])

    # Sin cancelacion, los 19 chunks restantes se seguian embebiendo.
    assert len(cliente.contents) <= 1
