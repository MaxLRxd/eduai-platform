import re


def estimate_tokens(text: str) -> int:
    """Estimación aproximada de tokens (código independiente del modelo)."""
    return max(1, len(text) // 4)


class ChunkingService:
    """Divide textos largos en fragmentos aptos para embedding y contexto."""

    def chunk_text(self, text: str, max_tokens: int = 500, overlap_tokens: int = 50) -> list[str]:
        if not text or not text.strip():
            return []

        normalized = re.sub(r"\s+", " ", text.strip())
        sentences = [s for s in re.split(r"(?<=[.!?])\s+", normalized) if s]

        max_chars = max_tokens * 4
        overlap_chars_limit = overlap_tokens * 4

        chunks: list[str] = []
        current: list[str] = []
        current_chars = 0

        for sentence in sentences:
            if len(sentence) > max_chars:
                if current:
                    chunks.append(" ".join(current))
                    current = []
                    current_chars = 0
                for start in range(0, len(sentence), max_chars):
                    chunks.append(sentence[start : start + max_chars])
                continue

            if current and current_chars + len(sentence) > max_chars:
                chunks.append(" ".join(current))

                overlap: list[str] = []
                overlap_chars = 0
                for prev in reversed(current):
                    if overlap_chars + len(prev) > overlap_chars_limit:
                        break
                    overlap.insert(0, prev)
                    overlap_chars += len(prev)

                current = overlap
                current_chars = overlap_chars

            current.append(sentence)
            current_chars += len(sentence)

        if current:
            chunks.append(" ".join(current))

        return chunks
