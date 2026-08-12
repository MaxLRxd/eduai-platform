"""Tests de la factory del vector store."""

import pytest

from src.config.settings import settings
from src.services.pinecone_service import PineconeRetrievalService
from src.services.retrieval_service import RetrievalService
from src.services.vector_store import build_retrieval_service


@pytest.mark.parametrize(
    "vector_store, api_key, expected_type",
    [
        ("pgvector", "", RetrievalService),
        ("pinecone", "pc-key", PineconeRetrievalService),
    ],
)
def test_build_retrieval_service(vector_store, api_key, expected_type, monkeypatch):
    monkeypatch.setattr(settings, "vector_store", vector_store)
    monkeypatch.setattr(settings, "pinecone_api_key", api_key)
    service = build_retrieval_service()
    assert isinstance(service, expected_type)


def test_build_pinecone_requires_api_key(monkeypatch):
    monkeypatch.setattr(settings, "vector_store", "pinecone")
    monkeypatch.setattr(settings, "pinecone_api_key", "")
    with pytest.raises(RuntimeError, match="PINECONE_API_KEY"):
        build_retrieval_service()


def test_build_unknown_vector_store_raises(monkeypatch):
    monkeypatch.setattr(settings, "vector_store", "weaviate")
    with pytest.raises(RuntimeError, match="VECTOR_STORE desconocido"):
        build_retrieval_service()
