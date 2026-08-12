"""Fakes de los servicios externos para los tests del tutor IA."""

from src.services.cache_service import CacheService


class FakeLLM:
    async def generate(self, system_instruction, messages, temperature=None, max_tokens=None):
        return "Respuesta de prueba del tutor basada en el material."

    async def stream(self, system_instruction, messages, temperature=None, max_tokens=None):
        for token in ["Hola", ", ", "soy", " ", "el", " ", "tutor"]:
            yield token


class FakeEmbeddings:
    async def embed_query(self, text):
        return [0.1, 0.2, 0.3]

    async def embed_documents(self, texts):
        return [[0.1, 0.2, 0.3] for _ in texts]


class FakeRetrieval:
    async def search(self, subject_id, embedding, top_k=5):
        return [
            {
                "material_id": "mat-1",
                "chunk_index": 0,
                "content": "Contenido indexado sobre la materia.",
                "score": 0.87,
            }
        ]

    async def upsert_chunks(self, subject_id, material_id, chunks, vectors):
        return None

    async def delete_material(self, subject_id, material_id):
        return None


class FakeCache(CacheService):
    def __init__(self):
        self._store: dict[str, str] = {}
        self._client = object()

    async def initialize(self):
        return None

    async def get(self, key):
        return self._store.get(key)

    async def set(self, key, value, ttl=None):
        self._store[key] = value

    async def close(self):
        return None
