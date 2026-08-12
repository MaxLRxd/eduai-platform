"""Caso de uso CU-A04: consultas en lenguaje natural al tutor IA contextualizadas a la materia."""

import json

from src.config.settings import settings
from src.prompts.hints import SYSTEM_PROMPT as HINTS_PROMPT
from src.prompts.socratic import SYSTEM_PROMPT as SOCRATIC_PROMPT
from src.prompts.tutor import SYSTEM_PROMPT as TUTOR_PROMPT
from src.schemas.tutor import TutorRequest
from src.services.cache_service import CacheService
from src.services.embeddings_service import EmbeddingsService
from src.services.llm_service import LLMService
from src.services.prompt_sanitizer import sanitize_prompt
from src.services.retrieval_service import RetrievalService
from src.use_cases._helpers import (
    build_sources,
    cache_key,
    format_context,
    normalize_messages,
)

MODE_PROMPTS = {
    "normal": TUTOR_PROMPT,
    "socratic": SOCRATIC_PROMPT,
    "hints": HINTS_PROMPT,
}


class AskTutorUseCase:
    def __init__(
        self,
        llm: LLMService,
        embeddings: EmbeddingsService,
        retrieval: RetrievalService,
        cache: CacheService,
    ):
        self.llm = llm
        self.embeddings = embeddings
        self.retrieval = retrieval
        self.cache = cache

    async def _prepare(self, req: TutorRequest) -> tuple[str, int, list[dict], str, list[dict]]:
        prompt_depurado, tokens_ahorrados = sanitize_prompt(req.question)
        query = prompt_depurado or req.question

        embedding = await self.embeddings.embed_query(query)
        results = await self.retrieval.search(req.subject_id, embedding, settings.retrieval_top_k)
        sources = build_sources(results)
        context = format_context(results)

        history = normalize_messages([{"role": m.role, "content": m.content} for m in req.history])
        user_content = (
            f"CONTEXTO (material de la cátedra):\n"
            f"{context or '(no hay material indexado disponible para esta materia)'}\n\n"
            f"Consulta del alumno:\n{query}"
        )
        messages = [*history, {"role": "user", "content": user_content}]
        return prompt_depurado, tokens_ahorrados, sources, MODE_PROMPTS[req.mode.value], messages

    async def execute(self, req: TutorRequest) -> dict:
        key = cache_key(req.subject_id, req.mode.value, req.question)
        cached = await self.cache.get(key)
        if cached is not None:
            payload = json.loads(cached)
            payload["cached"] = True
            return payload

        prompt_depurado, tokens_ahorrados, sources, system, messages = await self._prepare(req)
        answer = await self.llm.generate(
            system,
            messages,
            temperature=req.temperature,
            max_tokens=req.max_tokens,
        )

        response = {
            "answer": answer,
            "mode": req.mode.value,
            "sources": sources,
            "prompt_depurado": prompt_depurado,
            "tokens_ahorrados": tokens_ahorrados,
            "cached": False,
        }
        await self.cache.set(key, json.dumps(response, ensure_ascii=False))
        return response

    async def stream(self, req: TutorRequest):
        key = cache_key(req.subject_id, req.mode.value, req.question)
        cached = await self.cache.get(key)
        if cached is not None:
            payload = json.loads(cached)
            yield {"type": "token", "text": payload["answer"]}
            yield {
                "type": "done",
                "sources": payload.get("sources", []),
                "cached": True,
            }
            return

        prompt_depurado, tokens_ahorrados, sources, system, messages = await self._prepare(req)
        collected: list[str] = []
        async for token in self.llm.stream(
            system,
            messages,
            temperature=req.temperature,
            max_tokens=req.max_tokens,
        ):
            collected.append(token)
            yield {"type": "token", "text": token}

        answer = "".join(collected)
        response = {
            "answer": answer,
            "mode": req.mode.value,
            "sources": sources,
            "prompt_depurado": prompt_depurado,
            "tokens_ahorrados": tokens_ahorrados,
            "cached": False,
        }
        await self.cache.set(key, json.dumps(response, ensure_ascii=False))
        yield {"type": "done", "sources": sources, "cached": False}
