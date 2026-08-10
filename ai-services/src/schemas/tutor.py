"""Contratos de entrada/salida del tutor IA (Pydantic)."""

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class TutorMode(str, Enum):
    normal = "normal"
    socratic = "socratic"
    hints = "hints"


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class TutorRequest(BaseModel):
    subject_id: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)
    mode: TutorMode = TutorMode.normal
    history: list[ChatMessage] = Field(default_factory=list)
    max_tokens: int = Field(default=1024, ge=64, le=8192)
    temperature: float | None = Field(default=None, ge=0.0, le=2.0)


class Source(BaseModel):
    material_id: str
    chunk_index: int
    content: str
    score: float


class TutorResponse(BaseModel):
    answer: str
    mode: TutorMode
    sources: list[Source] = Field(default_factory=list)
    prompt_depurado: str | None = None
    tokens_ahorrados: int = 0
    cached: bool = False


class SummaryRequest(BaseModel):
    text: str = Field(..., min_length=1)
    language: str = Field(default="es", min_length=2, max_length=8)
    max_words: int = Field(default=150, ge=30, le=1000)


class SummaryResponse(BaseModel):
    summary: str


class ExamRequest(BaseModel):
    subject_id: str = Field(..., min_length=1)
    n_questions: int = Field(default=5, ge=1, le=20)
    difficulty: Literal["facil", "media", "dificil"] = "media"


class ExamQuestion(BaseModel):
    tipo: Literal["multiple_choice", "desarrollo"]
    enunciado: str
    opciones: list[str] = Field(default_factory=list)
    respuesta: str = ""


class ExamResponse(BaseModel):
    titulo: str
    dificultad: str
    preguntas: list[ExamQuestion]


class IndexMaterialRequest(BaseModel):
    subject_id: str = Field(..., min_length=1)
    material_id: str = Field(..., min_length=1)
    text: str = Field(..., min_length=1)


class IndexMaterialResponse(BaseModel):
    material_id: str
    chunks: int
    indexed: bool = True


class DepurarPromptRequest(BaseModel):
    prompt: str = Field(..., min_length=1)


class DepurarPromptResponse(BaseModel):
    prompt_original: str
    prompt_depurado: str
    tokens_originales: int
    tokens_depurado: int
    tokens_ahorrados: int
