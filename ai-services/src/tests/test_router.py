from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.routers import rag_router, tutor_router
from src.services.chunking_service import ChunkingService
from src.tests.fakes import FakeCache, FakeEmbeddings, FakeLLM, FakeRetrieval
from src.use_cases.ask_tutor import AskTutorUseCase
from src.use_cases.depurar_prompt import DepurarPromptUseCase
from src.use_cases.examen import GenerarExamenUseCase
from src.use_cases.index_material import IndexMaterialUseCase
from src.use_cases.resumir_documento import ResumirDocumentoUseCase


def _build_app():
    app = FastAPI()
    app.include_router(tutor_router.router)
    app.include_router(rag_router.router)

    cache = FakeCache()
    llm = FakeLLM()
    embeddings = FakeEmbeddings()
    retrieval = FakeRetrieval()
    chunking = ChunkingService()

    app.state.ask_tutor_use_case = AskTutorUseCase(llm, embeddings, retrieval, cache)
    app.state.index_material_use_case = IndexMaterialUseCase(chunking, embeddings, retrieval)
    app.state.resumir_use_case = ResumirDocumentoUseCase(llm, chunking)
    app.state.examen_use_case = GenerarExamenUseCase(llm, embeddings, retrieval)
    app.state.depurar_prompt_use_case = DepurarPromptUseCase()
    app.state.retrieval_service = retrieval

    @app.get("/healthz")
    def healthz() -> dict:
        return {"status": "ok"}

    return app


def test_healthz():
    client = TestClient(_build_app())
    response = client.get("/healthz")
    assert response.status_code == 200


def test_chat_endpoint():
    client = TestClient(_build_app())
    response = client.post(
        "/tutor/chat",
        json={"subject_id": "sub-1", "question": "¿Qué es un bucle?"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["answer"]
    assert body["cached"] is False


def test_chat_endpoint_validates_empty_question():
    client = TestClient(_build_app())
    response = client.post(
        "/tutor/chat",
        json={"subject_id": "sub-1", "question": ""},
    )
    assert response.status_code == 422


def test_stream_endpoint():
    client = TestClient(_build_app())
    response = client.post(
        "/tutor/chat/stream",
        json={"subject_id": "sub-1", "question": "Pregunta", "mode": "socratic"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    assert "data:" in response.text


def test_depurar_endpoint():
    client = TestClient(_build_app())
    response = client.post(
        "/tutor/depurar",
        json={"prompt": "Hola, o sea, ¿qué es una variable?"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["prompt_depurado"]
    assert body["tokens_ahorrados"] >= 0
