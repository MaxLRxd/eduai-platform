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


@pytest.mark.asyncio
async def test_generar_material_filtra_el_rag_por_material_ids():
    class RetrievalQueGuarda(FakeRetrieval):
        def __init__(self):
            self.material_ids_recibidos = None

        async def search(self, subject_id, embedding, top_k=5, min_score=None, material_ids=None):
            self.material_ids_recibidos = material_ids
            return await super().search(subject_id, embedding, top_k, min_score, material_ids)

    retrieval = RetrievalQueGuarda()
    use_case = GenerarMaterialUseCase(
        llm=FakeLLM(), embeddings=FakeEmbeddings(), retrieval=retrieval
    )

    await use_case.execute("sub-1", "Prepará actividades", material_ids=["mat-1", "mat-2"])

    assert retrieval.material_ids_recibidos == ["mat-1", "mat-2"]


@pytest.mark.asyncio
async def test_lista_vacia_de_materiales_no_filtra_el_rag():
    class RetrievalQueGuarda(FakeRetrieval):
        def __init__(self):
            self.material_ids_recibidos = "sin llamar"

        async def search(self, subject_id, embedding, top_k=5, min_score=None, material_ids=None):
            self.material_ids_recibidos = material_ids
            return await super().search(subject_id, embedding, top_k, min_score, material_ids)

    retrieval = RetrievalQueGuarda()
    use_case = GenerarMaterialUseCase(
        llm=FakeLLM(), embeddings=FakeEmbeddings(), retrieval=retrieval
    )

    result = await use_case.execute("sub-1", "Prepará actividades", material_ids=[])

    assert retrieval.material_ids_recibidos is None
    assert result["material"].startswith("Respuesta de prueba")


@pytest.mark.asyncio
async def test_material_seleccionado_sin_fragmentos_no_llama_al_llm():
    class LLMQueCuenta(FakeLLM):
        def __init__(self):
            self.llamadas = 0

        async def generate(self, system_instruction, messages, temperature=None, max_tokens=None):
            self.llamadas += 1
            return await super().generate(system_instruction, messages, temperature, max_tokens)

    class RetrievalVacio(FakeRetrieval):
        async def search(self, subject_id, embedding, top_k=5, min_score=None, material_ids=None):
            return []

    llm = LLMQueCuenta()
    use_case = GenerarMaterialUseCase(
        llm=llm, embeddings=FakeEmbeddings(), retrieval=RetrievalVacio()
    )

    result = await use_case.execute("sub-1", "Prepará actividades", material_ids=["mat-sin-indice"])

    assert "No encontré fragmentos indexados" in result["material"]
    assert result["sources"] == []
    assert llm.llamadas == 0
