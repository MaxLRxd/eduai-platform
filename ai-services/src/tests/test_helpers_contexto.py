"""Rotulado de fuentes en el contexto del RAG."""

from src.use_cases._helpers import build_sources, format_context

_RESULTADO = {
    "material_id": "24108a35-1015-4b1d-9b70-e9bae6ef3108",
    "chunk_index": 129,
    "content": "Las cargas se miden en kN.",
    "score": 0.8,
}


def test_rotula_con_el_titulo_y_sin_uuid():
    contexto = format_context([_RESULTADO], {_RESULTADO["material_id"]: "Reglamento CIRSOC 201"})

    assert '[Fuente: "Reglamento CIRSOC 201"]' in contexto
    assert "24108a35" not in contexto


def test_sin_titulo_no_expone_el_uuid():
    contexto = format_context([_RESULTADO])

    assert "material de la cátedra" in contexto
    assert "24108a35" not in contexto


def test_las_fuentes_incluyen_el_titulo():
    fuentes = build_sources([_RESULTADO], {_RESULTADO["material_id"]: "Reglamento"})

    assert fuentes[0]["titulo"] == "Reglamento"
