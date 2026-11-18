"""CU-P04: corrección con niveles. La nota sale del nivel de cada criterio, no del modelo."""

import json

import pytest

from src.prompts.correccion import SYSTEM_PROMPT, SYSTEM_PROMPT_NIVELES
from src.schemas.tutor import CorrectSubmissionRequest
from src.tests.fakes import FakeEmbeddings, FakeRetrieval
from src.use_cases.correct_submission import CorreccionEntregaUseCase, _formatear_rubrica

NIVELES = [
    {"nombre": "Excelente", "puntaje": 100},
    {"nombre": "Bueno", "puntaje": 75},
    {"nombre": "Regular", "puntaje": 50},
    {"nombre": "Insuficiente", "puntaje": 25},
]
RUBRICA = [
    {"nombre": "Conceptos", "peso": 60, "esperado": "Define el modelo relacional."},
    {"nombre": "Ejemplos", "peso": 40, "esperado": "Incluye un ejemplo propio."},
]


class LLMRegistrador:
    """Devuelve lo que se le indique y guarda lo que recibió, para revisar el prompt."""

    def __init__(self, respuesta: dict):
        self.respuesta = respuesta
        self.system = None
        self.user = None

    async def generate(self, system_instruction, messages, temperature=None, max_tokens=None):
        self.system = system_instruction
        self.user = messages[-1]["content"]
        return json.dumps(self.respuesta)


def _caso(respuesta: dict, **extra):
    llm = LLMRegistrador(respuesta)
    uc = CorreccionEntregaUseCase(llm=llm, embeddings=FakeEmbeddings(), retrieval=FakeRetrieval())
    req = CorrectSubmissionRequest(
        subject_id="sub-1",
        consigna="Explique.",
        entrega="Respuesta.",
        rubrica=RUBRICA,
        niveles=NIVELES,
        **extra,
    )
    return llm, uc, req


def _detalle(*niveles):
    return [
        {"nombre": c["nombre"], "nivel": n, "comentario": f"comentario de {c['nombre']}"}
        for c, n in zip(RUBRICA, niveles)
    ]


@pytest.mark.asyncio
async def test_la_nota_se_calcula_a_partir_de_los_niveles_y_no_de_la_cuenta_del_modelo():
    # Conceptos: Excelente (60 x 100%) + Ejemplos: Regular (40 x 50%) = 80 de 100 -> 8.0
    _, uc, req = _caso(
        {
            "feedback": "Muy buen trabajo.",
            "calificacion": 3,
            "detalle_por_criterio": _detalle("Excelente", "Regular"),
        }
    )

    resultado = await uc.execute(req)

    assert resultado["calificacion"] == 8.0  # ignora el "calificacion": 3 que dijo el modelo


@pytest.mark.asyncio
async def test_el_mejor_nivel_en_todo_da_diez_y_el_peor_da_la_base():
    _, uc, req = _caso(
        {"feedback": "ok", "detalle_por_criterio": _detalle("Excelente", "Excelente")}
    )
    assert (await uc.execute(req))["calificacion"] == 10.0

    _, uc, req = _caso(
        {"feedback": "ok", "detalle_por_criterio": _detalle("Insuficiente", "Insuficiente")}
    )
    assert (await uc.execute(req))["calificacion"] == 2.5


@pytest.mark.asyncio
async def test_el_feedback_lista_el_nivel_alcanzado_en_cada_criterio():
    _, uc, req = _caso(
        {"feedback": "Buen trabajo.", "detalle_por_criterio": _detalle("Bueno", "Excelente")}
    )

    resultado = await uc.execute(req)

    assert resultado["feedback"].startswith("Buen trabajo.")
    assert "Niveles alcanzados:" in resultado["feedback"]
    assert "- Conceptos: Bueno (75%)" in resultado["feedback"]
    assert "- Ejemplos: Excelente (100%)" in resultado["feedback"]
    assert [d["nivel"] for d in resultado["detalle_por_criterio"]] == ["Bueno", "Excelente"]


@pytest.mark.asyncio
async def test_acepta_mayusculas_y_espacios_distintos_en_nombres_de_criterio_y_nivel():
    detalle = [
        {"nombre": "  conceptos ", "nivel": " EXCELENTE", "comentario": ""},
        {"nombre": "EJEMPLOS", "nivel": "bueno ", "comentario": ""},
    ]
    _, uc, req = _caso({"feedback": "ok", "detalle_por_criterio": detalle})

    resultado = await uc.execute(req)

    assert resultado["calificacion"] == 9.0  # 60 + 30
    # Se informan los nombres tal como los definió el docente, no como los escribió el modelo.
    assert resultado["detalle_por_criterio"][0]["nombre"] == "Conceptos"
    assert resultado["detalle_por_criterio"][1]["nivel"] == "Bueno"


@pytest.mark.asyncio
async def test_un_nivel_inventado_no_se_acepta_pero_se_usa_la_nota_del_modelo_si_la_dio():
    _, uc, req = _caso(
        {
            "feedback": "ok",
            "calificacion": 6.5,
            "detalle_por_criterio": _detalle("Genial", "Excelente"),
        }
    )

    resultado = await uc.execute(req)

    assert resultado["calificacion"] == 6.5
    assert "Niveles alcanzados" not in resultado["feedback"]


@pytest.mark.asyncio
async def test_sin_niveles_resueltos_ni_nota_del_modelo_es_un_error_no_una_nota_inventada():
    _, uc, req = _caso(
        {"feedback": "ok", "detalle_por_criterio": [_detalle("Excelente", "Bueno")[0]]}
    )  # falta un criterio

    with pytest.raises(ValueError, match="nivel de todos los criterios"):
        await uc.execute(req)


@pytest.mark.asyncio
async def test_con_niveles_se_usa_el_prompt_de_niveles_y_se_le_pasan_niveles_y_descriptores():
    rubrica = [
        dict(
            RUBRICA[0],
            descriptores={
                "Excelente": "Define y relaciona claves.",
                "Regular": "Solo nombra tablas.",
            },
        ),
        RUBRICA[1],
    ]
    llm = LLMRegistrador(
        {"feedback": "ok", "detalle_por_criterio": _detalle("Excelente", "Excelente")}
    )
    uc = CorreccionEntregaUseCase(llm=llm, embeddings=FakeEmbeddings(), retrieval=FakeRetrieval())

    await uc.execute(
        CorrectSubmissionRequest(subject_id="s", entrega="e", rubrica=rubrica, niveles=NIVELES)
    )

    assert llm.system == SYSTEM_PROMPT_NIVELES
    assert (
        "NIVELES DE DESEMPEÑO (de mejor a peor): "
        "Excelente (100%), Bueno (75%), Regular (50%), Insuficiente (25%)"
        in llm.user
    )
    assert "Excelente: Define y relaciona claves." in llm.user
    assert "Regular: Solo nombra tablas." in llm.user
    # Los descriptores salen en el orden de los niveles (mejor primero), aunque vengan desordenados.
    assert llm.user.index("Excelente: Define") < llm.user.index("Regular: Solo nombra")


@pytest.mark.asyncio
async def test_sin_niveles_todo_sigue_igual_que_antes():
    llm = LLMRegistrador({"feedback": "Buen trabajo.", "calificacion": 7.0})
    uc = CorreccionEntregaUseCase(llm=llm, embeddings=FakeEmbeddings(), retrieval=FakeRetrieval())

    resultado = await uc.execute(
        CorrectSubmissionRequest(subject_id="s", entrega="e", rubrica=RUBRICA)
    )

    assert llm.system == SYSTEM_PROMPT
    assert "NIVELES" not in llm.user
    assert resultado == {"feedback": "Buen trabajo.", "calificacion": 7.0}


def test_el_prompt_de_niveles_no_le_pide_al_modelo_que_calcule_la_nota():
    assert "NO calcules la calificación" in SYSTEM_PROMPT_NIVELES
    assert '"nivel"' in SYSTEM_PROMPT_NIVELES


def test_formatear_rubrica_sin_niveles_no_agrega_encabezado():
    from src.schemas.tutor import CriterioRubrica

    texto = _formatear_rubrica([CriterioRubrica(**RUBRICA[0])])
    assert texto.startswith("- Conceptos (peso 60%)")
    assert "NIVELES" not in texto
