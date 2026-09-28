"""Servicio de llamadas al LLM (Gemini), incluyendo modo streaming.

Gemini devuelve con frecuencia errores transitorios (503 "high demand", 429 por
cuota). Sin reintentos, cada pico de demanda se convierte en un error para el
usuario final, asi que las llamadas se reintentan con backoff exponencial.
"""

import asyncio
import random

import structlog
from google.genai import types

from src.config.settings import settings

logger = structlog.get_logger(__name__)

# Substrings que identifican un fallo transitorio del proveedor. Cualquier otro
# error (400 por prompt invalido, 401 por key) no se reintenta: repetirlo solo
# gastaria cuota y delay sin chances de exito.
_ERRORES_TRANSITORIOS = (
    "503",
    "429",
    "UNAVAILABLE",
    "RESOURCE_EXHAUSTED",
    "high demand",
    "overloaded",
    "rate limit",
    "deadline exceeded",
    "connection reset",
    "timeout",
)


def es_error_transitorio(exc: BaseException) -> bool:
    """True si el error del proveedor es transitorio y vale la pena reintentar."""
    if isinstance(exc, (asyncio.TimeoutError, ConnectionError)):
        return True
    texto = f"{type(exc).__name__}: {exc}".lower()
    return any(marca in texto for marca in _ERRORES_TRANSITORIOS)


class LLMService:
    def __init__(self):
        if settings.llm_provider not in ("gemini", "google"):
            raise RuntimeError(
                f"Proveedor LLM no soportado: {settings.llm_provider!r} (actualmente solo 'gemini')"
            )
        self._api_key = settings.gemini_api_key
        self.model = settings.gemini_model
        self._client = None

    @property
    def client(self):
        if self._client is None:
            from src.config.genai import get_genai_client

            self._client = get_genai_client(self._api_key)
        return self._client

    def _build_contents(self, messages: list[dict]):
        contents = []
        for message in messages:
            role = "model" if message["role"] == "assistant" else "user"
            contents.append(
                types.Content(role=role, parts=[types.Part(text=message["content"])])
            )
        return contents

    def _build_config(
        self,
        system_instruction: str,
        temperature: float | None,
        max_tokens: int | None,
    ):
        config: dict = {
            "system_instruction": system_instruction,
            "temperature": (
                temperature if temperature is not None else settings.default_temperature
            ),
        }
        if max_tokens:
            config["max_output_tokens"] = max_tokens
        return types.GenerateContentConfig(**config)

    def _backoff(self, intento: int) -> float:
        """Espera exponencial con jitter para no martillar el proveedor en sync."""
        base = settings.llm_retry_base_delay_seconds * (2**intento)
        tope = settings.llm_retry_max_delay_seconds
        return min(base, tope) * (0.5 + random.random() / 2)

    async def _con_reintentos(self, operacion, evento: str):
        """Ejecuta `operacion` reintentando ante fallos transitorios del proveedor."""
        ultimo_error: Exception | None = None

        for intento in range(settings.llm_max_retries + 1):
            try:
                return await operacion()
            except Exception as exc:  # noqa: BLE001 - se reevalua abajo
                ultimo_error = exc
                if not es_error_transitorio(exc) or intento == settings.llm_max_retries:
                    break
                espera = self._backoff(intento)
                logger.warning(
                    "llm_reintento",
                    evento=evento,
                    modelo=self.model,
                    intento=intento + 1,
                    max_intentos=settings.llm_max_retries + 1,
                    espera_s=round(espera, 2),
                    error=str(exc),
                )
                await asyncio.sleep(espera)

        logger.error("llm_generate_error", evento=evento, error=str(ultimo_error))
        raise ultimo_error  # type: ignore[misc]

    async def generate(
        self,
        system_instruction: str,
        messages: list[dict],
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> str:
        async def llamada():
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=self._build_contents(messages),
                config=self._build_config(system_instruction, temperature, max_tokens),
            )
            return (response.text or "").strip()

        return await self._con_reintentos(llamada, "generate")

    async def stream(
        self,
        system_instruction: str,
        messages: list[dict],
        temperature: float | None = None,
        max_tokens: int | None = None,
    ):
        # Solo se reintenta abrir el stream. Si el error llega despues de haber
        # emitido tokens, reintentar duplicaria texto en el cliente.
        async def abrir():
            return await self.client.aio.models.generate_content_stream(
                model=self.model,
                contents=self._build_contents(messages),
                config=self._build_config(system_instruction, temperature, max_tokens),
            )

        stream = await self._con_reintentos(abrir, "stream_open")

        try:
            async for chunk in stream:
                if chunk.text:
                    yield chunk.text
        except Exception as exc:  # noqa: BLE001
            logger.error("llm_stream_error", error=str(exc))
            raise
