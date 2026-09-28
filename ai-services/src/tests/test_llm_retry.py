"""Tests del reintento con backoff ante errores transitorios de Gemini."""

import asyncio

import pytest

from src.services.llm_service import LLMService, es_error_transitorio


class _Transitorio(Exception):
    pass


class _Permanente(Exception):
    pass


class _ClienteFalso:
    """Simula el cliente de google-genai con una lista de resultados."""

    def __init__(self, resultados):
        self.resultados = list(resultados)
        self.llamadas = 0
        self.aio = self
        self.models = self

    async def generate_content(self, **_kwargs):
        self.llamadas += 1
        resultado = self.resultados.pop(0)
        if isinstance(resultado, Exception):
            raise resultado
        return resultado


class _Respuesta:
    def __init__(self, texto):
        self.text = texto


@pytest.fixture(autouse=True)
def _sin_espera(monkeypatch):
    """Elimina el sleep para que los tests no tarden."""
    async def _rapido(_segundos):
        return None

    monkeypatch.setattr(asyncio, "sleep", _rapido)


def _service_con(resultados, monkeypatch) -> LLMService:
    service = LLMService.__new__(LLMService)
    service._api_key = "test"
    service.model = "gemini-test"
    cliente = _ClienteFalso(resultados)
    object.__setattr__(service, "_client", cliente)
    return service


@pytest.mark.parametrize(
    "error",
    [
        _Transitorio("503 UNAVAILABLE. This model is currently experiencing high demand."),
        _Transitorio("429 RESOURCE_EXHAUSTED: quota exceeded"),
        _Transitorio("The model is overloaded"),
        _Transitorio("deadline exceeded"),
    ],
)
def test_es_error_transitorio_detecta_fallos_del_proveedor(error):
    assert es_error_transitorio(error) is True


@pytest.mark.parametrize(
    "error",
    [
        _Permanente("400 INVALID_ARGUMENT: prompt is too long"),
        _Permanente("401 UNAUTHENTICATED: API key not valid"),
        _Permanente("404 NOT_FOUND: model not found"),
    ],
)
def test_es_error_transitorio_ignora_errores_permanentes(error):
    assert es_error_transitorio(error) is False


@pytest.mark.asyncio
async def test_generate_reintenta_y_termina_ok(monkeypatch):
    service = _service_con(
        [
            _Transitorio("503 UNAVAILABLE high demand"),
            _Transitorio("503 UNAVAILABLE high demand"),
            _Respuesta("Resumen final."),
        ],
        monkeypatch,
    )

    resultado = await service.generate("sys", [{"role": "user", "content": "hola"}])

    assert resultado == "Resumen final."
    assert service.client.llamadas == 3


@pytest.mark.asyncio
async def test_generate_no_reintenta_errores_permanentes(monkeypatch):
    service = _service_con([_Permanente("401 UNAUTHENTICATED")], monkeypatch)

    with pytest.raises(_Permanente):
        await service.generate("sys", [{"role": "user", "content": "hola"}])

    assert service.client.llamadas == 1


@pytest.mark.asyncio
async def test_generate_agota_los_reintentos_y_propaga(monkeypatch):
    service = _service_con([_Transitorio("503 UNAVAILABLE")] * 6, monkeypatch)

    with pytest.raises(_Transitorio):
        await service.generate("sys", [{"role": "user", "content": "hola"}])

    # 1 intento inicial + llm_max_retries reintentos
    assert service.client.llamadas == 5
