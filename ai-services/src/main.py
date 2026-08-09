from fastapi import FastAPI

from src.config.settings import settings

app = FastAPI(title="EduAI AI Service")


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok"}