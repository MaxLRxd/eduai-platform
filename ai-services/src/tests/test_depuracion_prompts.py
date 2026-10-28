"""CU-SYS01: la depuración corre en todas las interfaces de IA con texto libre."""

import pytest

from src.schemas.tutor import TutorRequest
from src.services.prompt_sanitizer import (
    RESPUESTA_SALUDO,
    RESPUESTA_VACIO,
    depurar,
    sanitize_prompt,
)
from src.tests.fakes import FakeCache, FakeEmbeddings, FakeLLM, FakeRetrieval
from src.use_cases.ask_tutor import AskTutorUseCase
from src.use_cases.generar_material import GenerarMaterialUseCase


class LLMContador(FakeLLM):
    def __init__(self):
        self.llamadas = 0
        self.ultimo_mensaje = ""

    async def generate(self, system_instruction, messages, temperature=None, max_tokens=None):
        self.llamadas += 1
        self.ultimo_mensaje = messages[-1]["content"]
        return "Respuesta del LLM"

    async def stream(self, system_instruction, messages, temperature=None, max_tokens=None):
        self.llamadas += 1
        yield "Respuesta del LLM"


class EmbeddingsContador(FakeEmbeddings):
    def __init__(self):
        self.consultas: list[str] = []

    async def embed_query(self, text):
        self.consultas.append(text)
        return [0.1, 0.2, 0.3]


@pytest.fixture
def tutor():
    llm, embeddings = LLMContador(), EmbeddingsContador()
    caso = AskTutorUseCase(llm, embeddings, FakeRetrieval(), FakeCache())
    return caso, llm, embeddings


@pytest.fixture
def material():
    llm, embeddings = LLMContador(), EmbeddingsContador()
    return GenerarMaterialUseCase(llm, embeddings, FakeRetrieval()), llm, embeddings


# --- depurador -------------------------------------------------------------


def test_saludo_con_cortesia_queda_vacio_y_se_clasifica_como_saludo():
    resultado = depurar("Hola, ¿cómo estás?")
    assert resultado.texto == ""
    assert resultado.estado == "saludo"
    assert resultado.respuesta_directa == RESPUESTA_SALUDO


def test_solo_muletillas_se_clasifica_como_vacio():
    resultado = depurar("este... o sea...")
    assert resultado.estado == "vacio"
    assert resultado.respuesta_directa == RESPUESTA_VACIO


def test_saludo_mas_consulta_conserva_la_consulta():
    resultado = depurar("Buenas tardes, ¿qué es una variable?")
    assert resultado.estado == "ok"
    assert resultado.texto == "¿qué es una variable?"
    assert resultado.respuesta_directa is None


def test_historia_no_se_confunde_con_el_saludo_hi():
    cleaned, _ = sanitize_prompt("Historia de la computación")
    assert cleaned == "Historia de la computación"


def test_este_y_tipo_dentro_de_la_consulta_no_se_borran():
    cleaned, _ = sanitize_prompt("Resolvé este ejercicio con 5 preguntas tipo examen")
    assert cleaned == "Resolvé este ejercicio con 5 preguntas tipo examen"


def test_los_saltos_de_linea_se_conservan():
    cleaned, _ = sanitize_prompt("Armá una clase.\n\nPLANIFICACIÓN:\nUnidad 1")
    assert cleaned == "Armá una clase.\n\nPLANIFICACIÓN:\nUnidad 1"


# --- tutor (todos los modos) -------------------------------------------------


@pytest.mark.asyncio
async def test_tutor_saludo_no_consume_tokens_ni_busca_en_el_rag(tutor):
    caso, llm, embeddings = tutor
    resultado = await caso.execute(TutorRequest(subject_id="s", question="Hola, ¿qué tal?"))

    assert resultado["answer"] == RESPUESTA_SALUDO
    assert resultado["sources"] == []
    assert llm.llamadas == 0
    assert embeddings.consultas == []


@pytest.mark.asyncio
async def test_tutor_prompt_vacio_pide_reformular(tutor):
    caso, llm, _ = tutor
    resultado = await caso.execute(TutorRequest(subject_id="s", question="eh... este..."))

    assert resultado["answer"] == RESPUESTA_VACIO
    assert llm.llamadas == 0


@pytest.mark.asyncio
async def test_tutor_stream_saludo_no_llama_al_llm(tutor):
    caso, llm, _ = tutor
    eventos = [e async for e in caso.stream(TutorRequest(subject_id="s", question="Hola"))]

    assert eventos[0] == {"type": "token", "text": RESPUESTA_SALUDO}
    assert eventos[-1]["type"] == "done"
    assert llm.llamadas == 0


@pytest.mark.asyncio
async def test_tutor_envia_la_consulta_depurada(tutor):
    caso, llm, embeddings = tutor
    await caso.execute(
        TutorRequest(subject_id="s", question="Hola, o sea, ¿qué es un bucle???", mode="socratic")
    )

    assert embeddings.consultas == ["¿qué es un bucle?"]
    assert "¿qué es un bucle?" in llm.ultimo_mensaje
    assert "Hola" not in llm.ultimo_mensaje


# --- asistente docente -------------------------------------------------------


@pytest.mark.asyncio
async def test_asistente_docente_depura_el_pedido(material):
    caso, llm, embeddings = material
    await caso.execute("sub-1", "Buenas tardes, armame 10 preguntas tipo examen")

    assert embeddings.consultas == ["armame 10 preguntas tipo examen"]
    assert "Buenas tardes" not in llm.ultimo_mensaje


@pytest.mark.asyncio
async def test_asistente_docente_saludo_solo_no_llama_al_llm(material):
    caso, llm, embeddings = material
    resultado = await caso.execute("sub-1", "Hola buenas")

    assert resultado == {"material": RESPUESTA_SALUDO, "sources": []}
    assert llm.llamadas == 0
    assert embeddings.consultas == []


@pytest.mark.asyncio
async def test_si_el_depurador_falla_se_usa_el_prompt_original(monkeypatch):
    def roto(_):
        raise RuntimeError("boom")

    monkeypatch.setattr("src.services.prompt_sanitizer.sanitize_prompt", roto)
    resultado = depurar("¿Qué es una variable?")

    assert resultado.estado == "ok"
    assert resultado.texto == "¿Qué es una variable?"
    assert resultado.tokens_ahorrados == 0
