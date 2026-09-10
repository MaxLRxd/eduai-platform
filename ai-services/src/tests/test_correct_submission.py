import pytest

from src.schemas.tutor import CorrectSubmissionRequest
from src.tests.fakes import FakeCorreccionLLM, FakeEmbeddings, FakeRetrieval
from src.use_cases.correct_submission import CorreccionEntregaUseCase


@pytest.fixture
def use_case():
    return CorreccionEntregaUseCase(
        llm=FakeCorreccionLLM(),
        embeddings=FakeEmbeddings(),
        retrieval=FakeRetrieval(),
    )


@pytest.mark.asyncio
async def test_correccion_devuelve_feedback_y_calificacion(use_case):
    result = await use_case.execute(
        CorrectSubmissionRequest(
            subject_id="sub-1",
            consigna="Implementá una función que sume dos números.",
            entrega="function sumar(a, b) { return a + b; }",
            rubrica=[{"nombre": "Corrección", "peso": 100}],
        )
    )
    assert result["feedback"].startswith("Buen trabajo")
    assert result["calificacion"] == 8.5


@pytest.mark.asyncio
async def test_correccion_sin_rubrica_usa_por_defecto(use_case):
    result = await use_case.execute(
        CorrectSubmissionRequest(
            subject_id="sub-1",
            entrega="Respuesta del alumno",
        )
    )
    assert result["calificacion"] == 8.5


class FakeLLMFueraDeRango:
    async def generate(self, system_instruction, messages, temperature=None, max_tokens=None):
        return '{"feedback": "Feedback", "calificacion": 42}'


@pytest.mark.asyncio
async def test_correccion_recorta_calificacion_fuera_de_rango(use_case):
    use_case.llm = FakeLLMFueraDeRango()
    result = await use_case.execute(
        CorrectSubmissionRequest(subject_id="sub-1", entrega="Respuesta")
    )
    assert result["calificacion"] == 10.0
