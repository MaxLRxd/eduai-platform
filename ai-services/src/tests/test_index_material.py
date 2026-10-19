"""Tests del caso de uso de indexado."""

import pytest

from src.services.chunking_service import ChunkingService
from src.tests.fakes import FakeRetrieval
from src.use_cases.index_material import IndexMaterialUseCase


class _EmbedderAgregado:
    """Simula el bug original: un solo vector para N textos."""

    async def embed_documents(self, texts):
        return [[0.1, 0.2]]


class _RetrievalEspia(FakeRetrieval):
    def __init__(self):
        self.borrados = 0

    async def delete_material(self, subject_id, material_id):
        self.borrados += 1


async def test_falla_y_no_borra_si_faltan_vectores():
    retrieval = _RetrievalEspia()
    use_case = IndexMaterialUseCase(ChunkingService(), _EmbedderAgregado(), retrieval)
    texto = "Oracion de prueba numero uno. " * 400  # varios chunks

    with pytest.raises(RuntimeError, match="vectores"):
        await use_case.execute("s", "m", texto)
    assert retrieval.borrados == 0
