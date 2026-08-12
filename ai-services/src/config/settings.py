from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    gemini_api_key: str
    gemini_model: str = "gemini-3.6-flash"
    llm_provider: str = "gemini"
    gemini_embedding_model: str = "gemini-embedding-2"
    embedding_dimensions: int = 3072

    database_url: str = "postgresql://eduai:eduai@localhost:5432/eduai"
    redis_url: str = "redis://localhost:6379"

    vector_store: str = "pgvector"
    pinecone_api_key: str = ""
    pinecone_index: str = "eduai"
    pinecone_cloud: str = "aws"
    pinecone_region: str = "us-east-1"
    pinecone_metric: str = "cosine"

    redis_cache_ttl_seconds: int = 3600
    retrieval_top_k: int = 5

    default_temperature: float = 0.7
    default_max_tokens: int = 1024


settings = Settings()
