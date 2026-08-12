"""Caso de uso CU-SYS01: depuración de prompts de usuario."""

from src.services.chunking_service import estimate_tokens
from src.services.prompt_sanitizer import sanitize_prompt


class DepurarPromptUseCase:
    def execute(self, prompt: str) -> dict:
        cleaned, tokens_saved = sanitize_prompt(prompt)
        return {
            "prompt_original": prompt,
            "prompt_depurado": cleaned,
            "tokens_originales": estimate_tokens(prompt),
            "tokens_depurado": estimate_tokens(cleaned),
            "tokens_ahorrados": tokens_saved,
        }
