import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routers import health

logger = logging.getLogger(__name__)

app = FastAPI(title="EduAI AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")


@app.get("/")
async def root() -> dict:
    return {"service": "eduai-ai-service", "status": "ok"}