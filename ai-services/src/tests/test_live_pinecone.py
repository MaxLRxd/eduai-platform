"""Tests de integración en vivo contra Pinecone y Gemini.

Se saltan salvo que existan PINECONE_API_KEY y RUN_LIVE_TESTS=1.
No deben correr en CI ni en los tests locales normales.
"""

import os
import uuid

import pytest

from src.schemas.tutor import TutorRequest
from src.services.chunking_service import ChunkingService
from src.services.embeddings_service import EmbeddingsService
from src.services.llm_service import LLMService
from src.services.pinecone_service import PineconeRetrievalService
from src.tests.fakes import FakeCache
from src.use_cases.ask_tutor import AskTutorUseCase
from src.use_cases.index_material import IndexMaterialUseCase

pytestmark = pytest.mark.skipif(
    not (os.environ.get("PINECONE_API_KEY") and os.environ.get("RUN_LIVE_TESTS") == "1"),
    reason="requiere PINECONE_API_KEY y RUN_LIVE_TESTS=1 (prueba en vivo contra Pinecone)",
)

TEXTO_MATERIAL = (
    "Una funcion es una relacion entre un conjunto de entradas (dominio) y un conjunto de "
    "salidas (codominio). La regla de una funcion asigna a cada valor del dominio exactamente "
    "un valor del codominio. La funcion lineal se define como f(x) = mx + b, donde m es la "
    "pendiente y b la ordenada al origen. La funcion cuadratica es f(x) = ax^2 + bx + c, con a "
    "distinto de cero, y su grafica es una parabola."
)


@pytest.fixture
async def stack():
    retrieval = PineconeRetrievalService(
        api_key=os.environ["PINECONE_API_KEY"],
        index_name=os.environ.get("PINECONE_INDEX", "eduai"),
        dimension=3072,
        cloud=os.environ.get("PINECONE_CLOUD", "aws"),
        region=os.environ.get("PINECONE_REGION", "us-east-1"),
    )
    embeddings = EmbeddingsService()
    llm = LLMService()
    cache = FakeCache()
    index_uc = IndexMaterialUseCase(ChunkingService(), embeddings, retrieval)
    ask_uc = AskTutorUseCase(llm, embeddings, retrieval, cache)
    yield index_uc, ask_uc
    await retrieval.close()


@pytest.fixture
def subject_and_material():
    return "live-test", f"mat-{uuid.uuid4().hex[:8]}"


@pytest.mark.asyncio
async def test_index_chat_and_delete_pinecone(stack, subject_and_material):
    subject_id, material_id = subject_and_material
    index_uc, ask_uc = stack

    indexed = await index_uc.execute(subject_id, material_id, TEXTO_MATERIAL)
    assert indexed["indexed"] is True
    assert indexed["chunks"] >= 1

    result = await ask_uc.execute(
        TutorRequest(
            subject_id=subject_id,
            question="Como se define la funcion lineal?",
            mode="normal",
        )
    )
    assert result["cached"] is False
    assert result["answer"]
    assert any(source["material_id"] == material_id for source in result["sources"])

    await index_uc.retrieval.delete_material(subject_id, material_id)
    after_delete = await ask_uc.retrieval.search(subject_id, [0.1] * 3072, top_k=5)
    assert not any(row["material_id"] == material_id for row in after_delete)
