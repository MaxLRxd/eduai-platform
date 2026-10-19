"""Servicio de embeddings sobre la API de Gemini.

gemini-embedding-2 agrega todos los `contents` de una llamada en UN solo
vector (a diferencia de gemini-embedding-001, que devuelve uno por texto).
Por eso cada chunk se embebe en su propia llamada, con concurrencia acotada
y reintentos ante errores transitorios (429/503), y se valida que cada
respuesta traiga exactamente un vector.
"""

import asyncio
import random
import time

import structlog
from google.genai import types

from src.config.settings import settings
from src.services.llm_service import es_error_transitorio

logger = structlog.get_logger(__name__)


class EmbeddingsService:
    def __init__(self):
        self._api_key = settings.gemini_api_key
        self.model = settings.gemini_embedding_model
        self.dimensions = settings.embedding_dimensions
        self.concurrency = max(1, settings.embedding_concurrency)
        self.requests_per_minute = settings.embedding_requests_per_minute
        self._turno_lock = asyncio.Lock()
        self._proximo_turno = 0.0
        self._client = None

    @property
    def client(self):
        if self._client is None:
            from src.config.genai import get_genai_client

            self._client = get_genai_client(self._api_key)
        return self._client

    def _backoff(self, intento: int) -> float:
        base = settings.llm_retry_base_delay_seconds * (2**intento)
        tope = settings.embedding_retry_max_delay_seconds
        return min(base, tope) * (0.5 + random.random() / 2)

    async def _esperar_turno(self) -> None:
        """Espacia las llamadas para no pasar EMBEDDING_REQUESTS_PER_MINUTE."""
        if self.requests_per_minute <= 0:
            return
        intervalo = 60.0 / self.requests_per_minute
        async with self._turno_lock:
            ahora = time.monotonic()
            espera = self._proximo_turno - ahora
            if espera > 0:
                await asyncio.sleep(espera)
            self._proximo_turno = max(ahora, self._proximo_turno) + intervalo

    async def _embed_one(self, text: str, task_type: str) -> list[float]:
        """Embebe un solo texto, reintentando ante fallos transitorios."""
        max_reintentos = settings.embedding_max_retries
        for intento in range(max_reintentos + 1):
            await self._esperar_turno()
            try:
                # output_dimensionality fuerza el tamaño del vector al configurado
                # (EMBEDDING_DIMENSIONS <= 2000) en vez de la dimension nativa del
                # modelo, para que coincida con la columna `vector(n)` de pgvector.
                response = await self.client.aio.models.embed_content(
                    model=self.model,
                    contents=text,
                    config=types.EmbedContentConfig(
                        task_type=task_type,
                        output_dimensionality=self.dimensions,
                    ),
                )
            except Exception as exc:  # noqa: BLE001 - se reevalua abajo
                if not es_error_transitorio(exc) or intento == max_reintentos:
                    logger.error(
                        "embedding_error", modelo=self.model, intento=intento + 1, error=str(exc)
                    )
                    raise
                espera = self._backoff(intento)
                logger.warning(
                    "embedding_reintento",
                    modelo=self.model,
                    intento=intento + 1,
                    max_intentos=max_reintentos + 1,
                    espera_s=round(espera, 2),
                    error=str(exc),
                )
                await asyncio.sleep(espera)
                continue

            embeddings = response.embeddings or []
            if len(embeddings) != 1:
                raise RuntimeError(
                    f"El modelo {self.model} devolvio {len(embeddings)} vectores para 1 texto."
                )
            return list(embeddings[0].values)

        raise RuntimeError("unreachable")  # pragma: no cover

    async def _embed(self, texts: list[str], task_type: str) -> list[list[float]]:
        semaforo = asyncio.Semaphore(self.concurrency)
        total = len(texts)
        hechos = 0

        async def una(text: str) -> list[float]:
            nonlocal hechos
            async with semaforo:
                vector = await self._embed_one(text, task_type)
            hechos += 1
            if total >= 50 and (hechos % 50 == 0 or hechos == total):
                logger.info("embedding_progreso", hechos=hechos, total=total)
            return vector

        # gather conserva el orden de entrada: vectores[i] corresponde a texts[i].
        tareas = [asyncio.create_task(una(text)) for text in texts]
        try:
            vectores = await asyncio.gather(*tareas)
        except BaseException:
            # Si un chunk falla definitivamente, el resto no debe seguir
            # gastando cuota: el material igual no se va a indexar.
            for tarea in tareas:
                tarea.cancel()
            await asyncio.gather(*tareas, return_exceptions=True)
            raise
        if len(vectores) != total:
            raise RuntimeError(f"Se esperaban {total} vectores y llegaron {len(vectores)}.")
        return list(vectores)

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return await self._embed(texts, "RETRIEVAL_DOCUMENT")

    async def embed_query(self, text: str) -> list[float]:
        return await self._embed_one(text, "RETRIEVAL_QUERY")
