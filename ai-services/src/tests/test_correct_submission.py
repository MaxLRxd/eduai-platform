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


class FakeLLMQueCapturaElPrompt(FakeCorreccionLLM):
    """Guarda el prompt para poder verificar qué recibe el modelo."""

    def __init__(self):
        self.user_content = ""

    async def generate(self, system_instruction, messages, temperature=None, max_tokens=None):
        self.user_content = messages[0]["content"]
        return await super().generate(system_instruction, messages, temperature, max_tokens)


@pytest.mark.asyncio
async def test_el_prompt_incluye_el_esperado_de_cada_criterio(use_case):
    capturador = FakeLLMQueCapturaElPrompt()
    use_case.llm = capturador

    await use_case.execute(
        CorrectSubmissionRequest(
            subject_id="sub-1",
            consigna="Explique el modelo relacional.",
            entrega="Los datos se organizan en tablas.",
            rubrica=[
                {"nombre": "Conceptos", "peso": 60, "esperado": "Define claves primarias."},
                {"nombre": "Ejemplos", "peso": 40, "esperado": "Incluye un ejemplo propio."},
            ],
        )
    )

    prompt = capturador.user_content
    assert "Define claves primarias." in prompt
    assert "Incluye un ejemplo propio." in prompt
    assert "Conceptos (peso 60%)" in prompt
    assert "Ejemplos (peso 40%)" in prompt


@pytest.mark.asyncio
async def test_el_prompt_no_inventa_esperado_si_no_viene(use_case):
    capturador = FakeLLMQueCapturaElPrompt()
    use_case.llm = capturador

    await use_case.execute(
        CorrectSubmissionRequest(
            subject_id="sub-1",
            consigna="Consigna",
            entrega="Entrega",
            # Rubrica vieja, sin el campo esperado.
            rubrica=[{"nombre": "Conceptos", "peso": 100}],
        )
    )

    assert "Conceptos (peso 100%)" in capturador.user_content
    assert "Esperado:" not in capturador.user_content


@pytest.mark.asyncio
async def test_correccion_recorta_calificacion_fuera_de_rango(use_case):
    use_case.llm = FakeLLMFueraDeRango()
    result = await use_case.execute(
        CorrectSubmissionRequest(subject_id="sub-1", entrega="Respuesta")
    )
    assert result["calificacion"] == 10.0
