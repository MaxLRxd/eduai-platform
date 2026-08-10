import pytest

from src.schemas.tutor import TutorRequest
from src.tests.fakes import FakeCache, FakeEmbeddings, FakeLLM, FakeRetrieval
from src.use_cases.ask_tutor import AskTutorUseCase


@pytest.fixture
def use_case():
    return AskTutorUseCase(
        llm=FakeLLM(),
        embeddings=FakeEmbeddings(),
        retrieval=FakeRetrieval(),
        cache=FakeCache(),
    )


@pytest.mark.asyncio
async def test_ask_tutor_returns_answer_and_sources(use_case):
    result = await use_case.execute(
        TutorRequest(subject_id="sub-1", question="¿Qué es el operador ternario?")
    )
    assert result["answer"].startswith("Respuesta de prueba")
    assert result["mode"] == "normal"
    assert result["sources"][0]["material_id"] == "mat-1"
    assert result["cached"] is False


@pytest.mark.asyncio
async def test_ask_tutor_second_call_is_cached(use_case):
    request = TutorRequest(subject_id="sub-1", question="Misma pregunta")
    first = await use_case.execute(request)
    second = await use_case.execute(request)
    assert first["cached"] is False
    assert second["cached"] is True
    assert first["answer"] == second["answer"]


@pytest.mark.asyncio
async def test_ask_tutor_stream_yields_tokens_and_done(use_case):
    request = TutorRequest(subject_id="sub-1", question="Pregunta de streaming")
    events = [event async for event in use_case.stream(request)]
    types = [event["type"] for event in events]
    assert types[0] == "token"
    assert types[-1] == "done"
    assert events[-1]["cached"] is False
