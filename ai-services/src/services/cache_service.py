"""Servicio de cacheo en Redis para consultas y respuestas del tutor IA."""

import redis.asyncio as aioredis
import structlog

logger = structlog.get_logger(__name__)


class CacheService:
    """Caché clave/valor con TTL. Degrada de forma silenciosa si Redis no está disponible."""

    def __init__(self, url: str, ttl_seconds: int = 3600):
        self._url = url
        self._ttl = ttl_seconds
        self._client: aioredis.Redis | None = None

    async def initialize(self) -> None:
        self._client = aioredis.from_url(self._url, decode_responses=True, socket_connect_timeout=3)
        try:
            await self._client.ping()
        except Exception:
            logger.warning("redis_unavailable", url=self._url)
            self._client = None

    async def get(self, key: str) -> str | None:
        if self._client is None:
            return None
        try:
            return await self._client.get(key)
        except Exception:
            return None

    async def set(self, key: str, value: str, ttl: int | None = None) -> None:
        if self._client is None:
            return
        try:
            await self._client.set(key, value, ex=ttl or self._ttl)
        except Exception:
            pass

    async def close(self) -> None:
        if self._client is not None:
            try:
                await self._client.aclose()
            except Exception:
                pass
            self._client = None
