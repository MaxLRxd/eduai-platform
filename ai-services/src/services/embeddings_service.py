"""Servicio de embeddings sobre la API de Gemini."""

from google.genai import types

from src.config.settings import settings


class EmbeddingsService:
    def __init__(self):
        self._api_key = settings.gemini_api_key
        self.model = settings.gemini_embedding_model
        self._client = None

    @property
    def client(self):
        if self._client is None:
            from src.config.genai import get_genai_client

            self._client = get_genai_client(self._api_key)
        return self._client

    async def _embed(self, texts: list[str], task_type: str) -> list[list[float]]:
        response = await self.client.aio.models.embed_content(
            model=self.model,
            contents=texts,
            config=types.EmbedContentConfig(task_type=task_type),
        )
        return [list(embedding.values) for embedding in response.embeddings]

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return await self._embed(texts, "RETRIEVAL_DOCUMENT")

    async def embed_query(self, text: str) -> list[float]:
        values = await self._embed([text], "RETRIEVAL_QUERY")
        return values[0]
