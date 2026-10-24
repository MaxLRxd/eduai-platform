from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash-lite"
    llm_provider: str = "gemini"
    gemini_embedding_model: str = "gemini-embedding-2"
    # <= 2000 para que pgvector pueda crear el indice HNSW (ver retrieval_service).
    embedding_dimensions: int = 1536
    # Llamadas de embedding en paralelo (una por chunk) y reintentos ante 429/503.
    # Valores bajos priorizan no chocar con la cuota sobre la velocidad.
    embedding_concurrency: int = 4
    embedding_max_retries: int = 8
    # Tope de llamadas por minuto (0 = sin tope). El plan gratuito de Gemini
    # corta con 429 cerca de las 100/min; 40 deja margen tambien para el TPM.
    embedding_requests_per_minute: int = 40
    # La cuota por minuto se libera recien al minuto: el backoff debe llegar ahi.
    embedding_retry_max_delay_seconds: float = 65.0

    # Reintentos ante errores transitorios del proveedor (503 high demand, 429).
    llm_max_retries: int = 4
    llm_retry_base_delay_seconds: float = 2.0
    llm_retry_max_delay_seconds: float = 30.0

    database_url: str = "postgresql://eduai:eduai@localhost:5432/eduai"
    redis_url: str = "redis://localhost:6379"

    vector_store: str = "pgvector"
    pinecone_api_key: str = ""
    pinecone_index: str = "eduai"
    pinecone_cloud: str = "aws"
    pinecone_region: str = "us-east-1"
    pinecone_metric: str = "cosine"

    # Secreto compartido con el backend (header X-Internal-Token). Vacío = sin control (solo dev).
    ai_service_token: str = ""

    redis_cache_ttl_seconds: int = 3600
    retrieval_top_k: int = 5
    # Umbral mínimo de similitud coseno (1 - distancia). Si ningún chunk supera el umbral,
    # el tutor responde sin invocar al LLM indicando falta de información en el material indexado.
    retrieval_min_score: float = 0.0

    default_temperature: float = 0.7
    default_max_tokens: int = 1024


settings = Settings()
