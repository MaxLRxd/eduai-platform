"""CU-A11 (A2, A4): las respuestas externas se corrigen contra el material; sin él, es limitada."""

import json

import pytest
from fastapi.testclient import TestClient

from src.prompts.correccion_examen import SYSTEM_PROMPT
from src.schemas.tutor import CorrectExamRequest, ExamAnswerItem
from src.tests.fakes import FakeEmbeddings, FakeRetrieval
from src.tests.test_router import _build_app
from src.use_cases.corregir_simulacro import CorregirSimulacroUseCase


class LLMRegistrador:
    """Corrige como "parcial" cada pregunta de desarrollo que reciba y guarda el prompt."""

    def __init__(self):
        self.mensaje = ""

    async def generate(self, system_instruction, messages, temperature=None, max_tokens=None):
        self.mensaje = messages[-1]["content"]
        indices = [
            int(i) for i in __import__("re").findall(r"PREGUNTA \(indice (\d+)\)", self.mensaje)
        ]
        return json.dumps(
            {
                "resultados": [
                    {"indice": i, "veredicto": "parcial", "puntaje": 0.5, "feedback": "ok"}
                    for i in indices
                ]
            }
        )


class RetrievalSinMaterial(FakeRetrieval):
    async def search(self, subject_id, embedding, top_k=5, min_score=None):
        return []


class RetrievalRoto(FakeRetrieval):
    async def search(self, subject_id, embedding, top_k=5, min_score=None):
        raise RuntimeError("pgvector caido")


def externa(respuesta="El DNS traduce nombres en IPs.") -> ExamAnswerItem:
    return ExamAnswerItem(
        tipo="desarrollo", enunciado="¿Para qué sirve el DNS?", respuesta_alumno=respuesta
    )


def propia_del_simulacro() -> ExamAnswerItem:
    return ExamAnswerItem(
        tipo="desarrollo",
        enunciado="Explique TCP",
        respuesta_modelo="Protocolo confiable orientado a la conexión.",
        respuesta_alumno="Es un protocolo confiable.",
    )


def caso(retrieval=None, llm=None, con_servicios=True):
    llm = llm or LLMRegistrador()
    if con_servicios:
        return llm, CorregirSimulacroUseCase(llm, FakeEmbeddings(), retrieval or FakeRetrieval())
    return llm, CorregirSimulacroUseCase(llm)


def pedido(items, **extra):
    return CorrectExamRequest(subject_id="redes", titulo="Mis respuestas", items=items, **extra)


@pytest.mark.asyncio
async def test_una_respuesta_externa_se_corrige_contra_el_material_de_la_materia():
    llm, uc = caso()

    resultado = await uc.execute(pedido([externa()]))

    assert "MATERIAL DE LA CÁTEDRA:" in llm.mensaje
    assert "Contenido indexado sobre la materia." in llm.mensaje  # lo que devolvió la búsqueda
    assert "RESPUESTA MODELO: (no disponible)" in llm.mensaje
    assert resultado.material_limitado is False
    assert resultado.resultados[0].veredicto == "parcial"


@pytest.mark.asyncio
async def test_sin_material_en_la_materia_se_corrige_igual_pero_se_marca_como_limitada():
    llm, uc = caso(retrieval=RetrievalSinMaterial())

    resultado = await uc.execute(pedido([externa()]))

    assert "no se encontró material de la materia" in llm.mensaje
    assert resultado.material_limitado is True
    assert len(resultado.resultados) == 1  # igual hay corrección


@pytest.mark.asyncio
async def test_si_la_busqueda_falla_no_se_rompe_la_correccion_y_queda_limitada():
    _, uc = caso(retrieval=RetrievalRoto())

    resultado = await uc.execute(pedido([externa()]))

    assert resultado.material_limitado is True


@pytest.mark.asyncio
async def test_sin_servicios_de_busqueda_tambien_queda_limitada():
    _, uc = caso(con_servicios=False)

    assert (await uc.execute(pedido([externa()]))).material_limitado is True


@pytest.mark.asyncio
async def test_el_material_elegido_por_el_alumno_sirve_de_referencia_y_no_es_limitada():
    llm, uc = caso(retrieval=RetrievalSinMaterial())

    resultado = await uc.execute(
        pedido([externa()], material_referencia="El DNS es el sistema de nombres de dominio.")
    )

    assert "[Fuente: material elegido por el alumno]" in llm.mensaje
    assert "sistema de nombres de dominio" in llm.mensaje
    assert resultado.material_limitado is False


@pytest.mark.asyncio
async def test_una_pregunta_con_respuesta_modelo_no_busca_material_ni_se_marca_limitada():
    class RetrievalQueNoDebeUsarse(FakeRetrieval):
        async def search(self, *args, **kwargs):
            raise AssertionError("no hacía falta buscar material")

    llm, uc = caso(retrieval=RetrievalQueNoDebeUsarse())

    resultado = await uc.execute(pedido([propia_del_simulacro()]))

    assert "MATERIAL DE LA CÁTEDRA" not in llm.mensaje
    assert resultado.material_limitado is False


@pytest.mark.asyncio
async def test_en_un_mismo_pedido_solo_las_externas_llevan_material():
    llm, uc = caso()

    await uc.execute(pedido([propia_del_simulacro(), externa()]))

    assert llm.mensaje.count("MATERIAL DE LA CÁTEDRA:") == 1
    assert llm.mensaje.index("Explique TCP") < llm.mensaje.index("MATERIAL DE LA CÁTEDRA:")


@pytest.mark.asyncio
async def test_una_pregunta_sin_responder_no_gasta_busqueda_ni_modelo():
    llm, uc = caso()

    resultado = await uc.execute(pedido([externa(respuesta="   ")]))

    assert llm.mensaje == ""  # no se llamó al modelo
    assert resultado.resultados[0].veredicto == "sin_responder"
    assert resultado.material_limitado is False


@pytest.mark.asyncio
async def test_una_opcion_multiple_sin_la_opcion_correcta_no_se_puede_corregir():
    _, uc = caso()
    item = ExamAnswerItem(
        tipo="multiple_choice", enunciado="¿Cuál?", opciones=["a", "b"], respuesta_alumno="a"
    )

    with pytest.raises(ValueError, match="no tiene la opción correcta"):
        await uc.execute(pedido([item]))


def test_el_prompt_explica_como_corregir_sin_respuesta_modelo_y_sin_material():
    assert "no trae respuesta modelo" in SYSTEM_PROMPT
    assert "es limitada" in SYSTEM_PROMPT


def test_endpoint_de_estado_del_material_devuelve_la_cantidad_de_fragmentos():
    client = TestClient(_build_app())

    response = client.get("/rag/material/estado/redes")

    assert response.status_code == 200
    assert response.json() == {"subject_id": "redes", "fragmentos": 7}


def test_endpoint_de_estado_responde_502_si_el_almacen_vectorial_falla():
    app = _build_app()

    async def roto(subject_id):
        raise RuntimeError("sin conexion")

    app.state.retrieval_service.count_chunks = roto

    assert TestClient(app).get("/rag/material/estado/redes").status_code == 502


def test_el_endpoint_de_correccion_devuelve_material_limitado():
    app = _build_app()
    app.state.corregir_simulacro_use_case = CorregirSimulacroUseCase(
        LLMRegistrador(), FakeEmbeddings(), RetrievalSinMaterial()
    )

    response = TestClient(app).post(
        "/tutor/examen/corregir",
        json={
            "subject_id": "redes",
            "items": [
                {"tipo": "desarrollo", "enunciado": "¿Qué es DNS?", "respuesta_alumno": "Nombres."}
            ],
        },
    )

    assert response.status_code == 200
    assert response.json()["material_limitado"] is True
