from src.services.chunking_service import ChunkingService


def test_chunk_text_short_document_returns_single_chunk():
    service = ChunkingService()
    chunks = service.chunk_text("Un texto corto sobre la materia.", max_tokens=500)
    assert len(chunks) == 1
    assert "materia" in chunks[0]


def test_chunk_text_splits_long_document():
    service = ChunkingService()
    sentences = [f"Esta es la oración número {i} del texto de ejemplo." for i in range(50)]
    text = " ".join(sentences)
    chunks = service.chunk_text(text, max_tokens=50)
    assert len(chunks) > 1
    assert "oración" in chunks[0]


def test_chunk_text_empty_input():
    service = ChunkingService()
    assert service.chunk_text("") == []
    assert service.chunk_text("   ") == []


def test_chunk_text_preserves_whitespace_normalization():
    service = ChunkingService()
    chunks = service.chunk_text("  Primera oración.    Segunda oración.  ")
    assert len(chunks) == 1
    assert "  " not in chunks[0]
