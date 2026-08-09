from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str | None = None
    chroma_url: str = "http://localhost:8001"
    redis_url: str = "redis://localhost:6379"
    port: int = 8000


@lru_cache
def get_settings() -> Settings:
    return Settings()