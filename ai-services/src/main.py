import hmac
from contextlib import asynccontextmanager

import structlog
from fastapi import Depends, FastAPI, Header, HTTPException

from src.config.settings import settings
from src.routers import rag_router, tutor_router
from src.services.cache_service import CacheService
from src.services.chunking_service import ChunkingService
from src.services.document_service import DocumentService
from src.services.embeddings_service import EmbeddingsService
from src.services.llm_service import LLMService
from src.services.vector_store import build_retrieval_service
from src.use_cases.ask_tutor import AskTutorUseCase
from src.use_cases.correct_submission import CorreccionEntregaUseCase
from src.use_cases.corregir_simulacro import CorregirSimulacroUseCase
from src.use_cases.depurar_prompt import DepurarPromptUseCase
from src.use_cases.examen import GenerarExamenUseCase
from src.use_cases.generar_material import GenerarMaterialUseCase
from src.use_cases.index_material import IndexMaterialUseCase
from src.use_cases.resumir_documento import ResumirDocumentoUseCase

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer(),
    ]
)


def verificar_token_interno(x_internal_token: str | None = Header(default=None)) -> None:
    """Solo el backend puede usar el servicio: evita que terceros consuman la cuota del LLM."""
    esperado = settings.ai_service_token
    if not esperado:
        return
    if not x_internal_token or not hmac.compare_digest(x_internal_token, esperado):
        raise HTTPException(status_code=401, detail="No autorizado")


def create_app() -> FastAPI:
    app = FastAPI(title="EduAI AI Service", version="1.0.0", lifespan=lifespan)
    protegido = [Depends(verificar_token_interno)]
    app.include_router(tutor_router.router, dependencies=protegido)
    app.include_router(rag_router.router, dependencies=protegido)
    return app


@asynccontextmanager
async def lifespan(app: FastAPI):
    llm = LLMService()
    cache = CacheService(settings.redis_url, settings.redis_cache_ttl_seconds)
    await cache.initialize()
    embeddings = EmbeddingsService()
    retrieval = build_retrieval_service(embeddings)
    chunking = ChunkingService()
    document = DocumentService()

    app.state.llm_service = llm
    app.state.cache_service = cache
    app.state.embeddings_service = embeddings
    app.state.retrieval_service = retrieval
    app.state.chunking_service = chunking
    app.state.document_service = document
    app.state.ask_tutor_use_case = AskTutorUseCase(llm, embeddings, retrieval, cache)
    app.state.index_material_use_case = IndexMaterialUseCase(chunking, embeddings, retrieval)
    app.state.resumir_use_case = ResumirDocumentoUseCase(llm, chunking)
    app.state.examen_use_case = GenerarExamenUseCase(llm, embeddings, retrieval)
    app.state.generar_material_use_case = GenerarMaterialUseCase(llm, embeddings, retrieval)
    app.state.correccion_use_case = CorreccionEntregaUseCase(llm, embeddings, retrieval)
    app.state.corregir_simulacro_use_case = CorregirSimulacroUseCase(llm)
    app.state.depurar_prompt_use_case = DepurarPromptUseCase()

    yield

    await cache.close()
    await retrieval.close()


app = create_app()


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok"}
