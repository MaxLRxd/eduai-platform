"""Servicio de llamadas al LLM (Gemini), incluyendo modo streaming."""

import structlog
from google.genai import types

from src.config.genai import get_genai_client
from src.config.settings import settings

logger = structlog.get_logger(__name__)


class LLMService:
    def __init__(self):
        if settings.llm_provider not in ("gemini", "google"):
            raise RuntimeError(
                f"Proveedor LLM no soportado: {settings.llm_provider!r} (actualmente solo 'gemini')"
            )
        self.client = get_genai_client(settings.gemini_api_key)
        self.model = settings.gemini_model

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

    async def generate(
        self,
        system_instruction: str,
        messages: list[dict],
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> str:
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=self._build_contents(messages),
                config=self._build_config(system_instruction, temperature, max_tokens),
            )
            return (response.text or "").strip()
        except Exception as exc:
            logger.error("llm_generate_error", error=str(exc))
            raise

    async def stream(
        self,
        system_instruction: str,
        messages: list[dict],
        temperature: float | None = None,
        max_tokens: int | None = None,
    ):
        try:
            stream = await self.client.aio.models.generate_content_stream(
                model=self.model,
                contents=self._build_contents(messages),
                config=self._build_config(system_instruction, temperature, max_tokens),
            )
            async for chunk in stream:
                if chunk.text:
                    yield chunk.text
        except Exception as exc:
            logger.error("llm_stream_error", error=str(exc))
            raise
