"""CU-A11: corrección de simulacros."""

import pytest

from src.schemas.tutor import CorrectExamRequest, ExamAnswerItem
from src.tests.fakes import FakeExamenCorreccionLLM
from src.use_cases.corregir_simulacro import CorregirSimulacroUseCase


def mc(respuesta_alumno: str, correcta: str = "Paris") -> ExamAnswerItem:
    return ExamAnswerItem(
        tipo="multiple_choice",
        enunciado="Capital de Francia",
        opciones=["Madrid", "Paris", "Roma", "Lima"],
        respuesta_modelo=correcta,
        respuesta_alumno=respuesta_alumno,
    )


def desarrollo(respuesta_alumno: str) -> ExamAnswerItem:
    return ExamAnswerItem(
        tipo="desarrollo",
        enunciado="Explique la fotosíntesis",
        respuesta_modelo="Proceso por el cual las plantas producen glucosa con luz.",
        respuesta_alumno=respuesta_alumno,
    )


async def corregir(items, llm=None):
    caso = CorregirSimulacroUseCase(llm or FakeExamenCorreccionLLM())
    return await caso.execute(CorrectExamRequest(subject_id="s", items=items))


@pytest.mark.asyncio
@pytest.mark.parametrize("respuesta", ["Paris", "paris.", "  PARIS ", "b", "b)"])
async def test_multiple_choice_correcta_acepta_texto_o_letra(respuesta):
    llm = FakeExamenCorreccionLLM()
    resultado = await corregir([mc(respuesta)], llm)

    assert resultado.resultados[0].veredicto == "correcta"
    assert resultado.resultados[0].puntaje == 1.0
    assert llm.llamadas == 0  # opción múltiple no consume el LLM


@pytest.mark.asyncio
async def test_multiple_choice_incorrecta_indica_la_opcion_correcta():
    resultado = await corregir([mc("Roma")])

    r = resultado.resultados[0]
    assert r.veredicto == "incorrecta"
    assert r.puntaje == 0.0
    assert "Paris" in r.feedback


@pytest.mark.asyncio
async def test_pregunta_sin_responder_no_llama_al_llm():
    llm = FakeExamenCorreccionLLM()
    resultado = await corregir([mc("   "), desarrollo("")], llm)

    assert [r.veredicto for r in resultado.resultados] == ["sin_responder", "sin_responder"]
    assert llm.llamadas == 0


@pytest.mark.asyncio
async def test_desarrollo_se_corrige_con_un_unico_llamado_al_llm():
    llm = FakeExamenCorreccionLLM()
    resultado = await corregir([mc("b"), desarrollo("Las plantas usan luz.")], llm)

    assert llm.llamadas == 1
    assert [r.veredicto for r in resultado.resultados] == ["correcta", "parcial"]
    assert resultado.resultados[1].puntaje == 0.5
    assert "RESPUESTA MODELO" in llm.ultimo_mensaje


@pytest.mark.asyncio
async def test_se_depura_la_respuesta_pero_se_conserva_si_quedara_vacia():
    llm = FakeExamenCorreccionLLM()
    await corregir([mc("b"), desarrollo("Hola, las plantas usan luz.")], llm)
    assert "Hola," not in llm.ultimo_mensaje

    solo_saludo = FakeExamenCorreccionLLM()
    await corregir([mc("b"), desarrollo("hola")], solo_saludo)
    assert "RESPUESTA DEL ALUMNO: hola" in solo_saludo.ultimo_mensaje


@pytest.mark.asyncio
async def test_veredicto_desconocido_se_trata_como_incorrecta_y_el_puntaje_se_acota():
    llm = FakeExamenCorreccionLLM(
        '{"resultados": [{"indice": 0, "veredicto": "excelente", "puntaje": 7, "feedback": "x"}]}'
    )
    resultado = await corregir([desarrollo("algo")], llm)

    assert resultado.resultados[0].veredicto == "incorrecta"
    assert resultado.resultados[0].puntaje == 1.0


@pytest.mark.asyncio
async def test_si_el_modelo_omite_preguntas_falla_para_poder_reintentar():
    llm = FakeExamenCorreccionLLM('{"resultados": []}')
    with pytest.raises(ValueError, match="no corrigió todas"):
        await corregir([desarrollo("algo")], llm)


@pytest.mark.asyncio
async def test_respuesta_del_modelo_sin_json_falla():
    llm = FakeExamenCorreccionLLM("no pude corregir")
    with pytest.raises(ValueError, match="JSON"):
        await corregir([desarrollo("algo")], llm)
