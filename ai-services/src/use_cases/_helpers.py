"""Helpers compartidos por los casos de uso."""

import hashlib


def format_context(results: list[dict], titles: dict[str, str] | None = None) -> str:
    """Convierte los fragmentos recuperados en un bloque de contexto legible.

    Cada fragmento se rotula con el titulo del material (el que ve el alumno).
    Nunca con el material_id: el LLM lo copiaba tal cual en las citas
    ("Material 24108a35-..., fragmento 129").
    """
    if not results:
        return ""
    titles = titles or {}
    parts = []
    for result in results:
        titulo = titles.get(result["material_id"])
        etiqueta = f'[Fuente: "{titulo}"]' if titulo else "[Fuente: material de la cátedra]"
        parts.append(f"{etiqueta}\n{result['content']}")
    return "\n\n".join(parts)


def build_sources(results: list[dict], titles: dict[str, str] | None = None) -> list[dict]:
    titles = titles or {}
    sources = []
    for result in results:
        sources.append(
            {
                "material_id": result["material_id"],
                "titulo": titles.get(result["material_id"]),
                "chunk_index": result["chunk_index"],
                "content": result["content"],
                "score": float(result["score"]),
            }
        )
    return sources


def normalize_messages(messages: list[dict]) -> list[dict]:
    """Garantiza que la lista de mensajes comience con 'user' y sin roles consecutivos repetidos."""
    normalized: list[dict] = []
    for message in messages:
        if not normalized:
            if message["role"] != "user":
                continue
            normalized.append(message)
            continue
        if normalized[-1]["role"] == message["role"]:
            normalized[-1]["content"] = f"{normalized[-1]['content']}\n{message['content']}"
        else:
            normalized.append(message)
    return normalized


def cache_key(subject_id: str, mode: str, question: str) -> str:
    raw = f"{subject_id}::{mode}::{question}"
    return f"tutor:{hashlib.sha256(raw.encode()).hexdigest()}"
