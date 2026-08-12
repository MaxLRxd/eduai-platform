import os

os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("LLM_PROVIDER", "gemini")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
os.environ.setdefault("DATABASE_URL", "postgresql://eduai:eduai@localhost:5432/eduai")
