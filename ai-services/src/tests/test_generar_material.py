import pytest

from src.tests.fakes import FakeEmbeddings, FakeLLM, FakeRetrieval
from src.use_cases.generar_material import GenerarMaterialUseCase


@pytest.fixture
def use_case():
    return GenerarMaterialUseCase(
        llm=FakeLLM(),
        embeddings=FakeEmbeddings(),
        retrieval=FakeRetrieval(),
    )


@pytest.mark.asyncio
async def test_generar_material_returns_material_and_sources(use_case):
    result = await use_case.execute("sub-1", "Prepará actividades para la clase de hoy")
    assert result["material"].startswith("Respuesta de prueba")
    assert result["sources"][0]["material_id"] == "mat-1"
    assert result["sources"][0]["chunk_index"] == 0
