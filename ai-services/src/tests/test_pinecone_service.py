"""Tests del servicio de búsqueda vectorial en Pinecone."""

import pytest

from src.services.pinecone_service import PineconeRetrievalService


class FakeIndex:
    def __init__(self):
        self.upserts: list[tuple[list, str]] = []
        self.deletes: list[tuple[dict, str]] = []
        self.matches: list = []

    def upsert(self, vectors, namespace):
        self.upserts.append((vectors, namespace))

    def query(self, vector, top_k, namespace, include_metadata):
        return FakeQueryResponse(self.matches)

    def delete(self, filter, namespace):
        self.deletes.append((filter, namespace))


class FakeQueryResponse:
    def __init__(self, matches):
        self.matches = matches


class FakeMatch:
    def __init__(self, score, metadata):
        self.score = score
        self.metadata = metadata


class FakePinecone:
    def __init__(self, existing_indexes=None):
        self._indexes = set(existing_indexes or [])
        self._created = []
        self._closed = False
        self.index = FakeIndex()

    def list_indexes(self):
        class _Named:
            def __init__(self, name):
                self.name = name

        return [_Named(name) for name in sorted(self._indexes)]

    def create_index(self, name, dimension, metric, spec):
        self._created.append(
            {"name": name, "dimension": dimension, "metric": metric, "spec": spec}
        )
        self._indexes.add(name)

    def describe_index(self, name):
        desc = type("Desc", (), {})()
        desc.status = {"ready": True}
        return desc

    def Index(self, name):
        return self.index

    def close(self):
        self._closed = True


@pytest.fixture
def fake_pinecone(monkeypatch):
    fake = FakePinecone()

    def _make_pc(api_key):
        return fake

    monkeypatch.setattr("src.services.pinecone_service.Pinecone", _make_pc)
    monkeypatch.setattr(
        "src.services.pinecone_service.ServerlessSpec",
        lambda cloud, region: {"cloud": cloud, "region": region},
    )
    return fake


def make_service(fake_pinecone) -> PineconeRetrievalService:
    return PineconeRetrievalService(
        api_key="k",
        index_name="eduai",
        dimension=3072,
        cloud="aws",
        region="us-east-1",
    )


@pytest.mark.asyncio
async def test_creates_serverless_index_when_missing(fake_pinecone):
    service = make_service(fake_pinecone)
    await service.upsert_chunks(
        subject_id="mat-1",
        material_id="funciones",
        chunks=["chunk uno", "chunk dos"],
        vectors=[[0.1] * 3072, [0.2] * 3072],
    )
    assert len(fake_pinecone._created) == 1
    created = fake_pinecone._created[0]
    assert created["name"] == "eduai"
    assert created["dimension"] == 3072
    assert created["metric"] == "cosine"
    assert created["spec"] == {"cloud": "aws", "region": "us-east-1"}


@pytest.mark.asyncio
async def test_does_not_recreate_existing_index(fake_pinecone):
    fake_pinecone._indexes.add("eduai")
    service = make_service(fake_pinecone)
    await service.upsert_chunks(
        subject_id="mat-1",
        material_id="m1",
        chunks=["chunk"],
        vectors=[[0.1] * 3072],
    )
    assert fake_pinecone._created == []


@pytest.mark.asyncio
async def test_upsert_stores_metadata_and_namespace(fake_pinecone):
    service = make_service(fake_pinecone)
    await service.upsert_chunks(
        subject_id="mat-1",
        material_id="m1",
        chunks=["contenido del chunk"],
        vectors=[[0.5] * 3072],
    )
    vectors, namespace = fake_pinecone.index.upserts[0]
    assert namespace == "mat-1"
    assert vectors[0]["id"] == "m1:0"
    assert vectors[0]["values"] == [0.5] * 3072
    assert vectors[0]["metadata"]["text"] == "contenido del chunk"
    assert vectors[0]["metadata"]["material_id"] == "m1"


@pytest.mark.asyncio
async def test_search_maps_matches(fake_pinecone):
    service = make_service(fake_pinecone)
    fake_pinecone.index.matches = [
        FakeMatch(
            score=0.87,
            metadata={
                "material_id": "m1",
                "chunk_index": 2,
                "text": "contenido",
            },
        )
    ]
    rows = await service.search("mat-1", [0.1] * 3072, top_k=5)
    assert rows[0] == {
        "material_id": "m1",
        "chunk_index": 2,
        "content": "contenido",
        "score": 0.87,
    }


@pytest.mark.asyncio
async def test_delete_material_filters_by_material_id(fake_pinecone):
    service = make_service(fake_pinecone)
    await service.delete_material("mat-1", "m1")
    filter, namespace = fake_pinecone.index.deletes[0]
    assert filter == {"material_id": "m1"}
    assert namespace == "mat-1"


@pytest.mark.asyncio
async def test_close_closes_client(fake_pinecone):
    service = make_service(fake_pinecone)
    await service.upsert_chunks("mat-1", "m1", ["c"], [[0.1] * 3072])
    await service.close()
    assert fake_pinecone._closed is True
