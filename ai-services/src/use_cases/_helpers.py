"""Helpers compartidos por los casos de uso."""

import hashlib


def format_context(results: list[dict]) -> str:
    """Convierte los fragmentos recuperados en un bloque de contexto legible."""
    if not results:
        return ""
    parts = []
    for result in results:
        parts.append(
            f"[Material {result['material_id']} · fragmento {result['chunk_index']}]"
            f"\n{result['content']}"
        )
    return "\n\n".join(parts)


def build_sources(results: list[dict]) -> list[dict]:
    sources = []
    for result in results:
        sources.append(
            {
                "material_id": result["material_id"],
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
