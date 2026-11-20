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


# ───────────── streaming: el 503 llega al leer el primer fragmento ─────────────


class _Flujo:
    """Un stream de Gemini: cada elemento es un texto, None (fragmento sin texto) o un error."""

    def __init__(self, elementos):
        self.elementos = list(elementos)

    def __aiter__(self):
        return self

    async def __anext__(self):
        if not self.elementos:
            raise StopAsyncIteration
        elemento = self.elementos.pop(0)
        if isinstance(elemento, Exception):
            raise elemento
        return _Respuesta(elemento)


class _ClienteStream:
    def __init__(self, flujos):
        self.flujos = list(flujos)
        self.llamadas = 0
        self.aio = self
        self.models = self

    async def generate_content_stream(self, **_kwargs):
        self.llamadas += 1
        flujo = self.flujos.pop(0)
        if isinstance(flujo, Exception):
            raise flujo
        return flujo


def _service_stream(flujos) -> tuple[LLMService, _ClienteStream]:
    service = LLMService.__new__(LLMService)
    service._api_key = "test"
    service.model = "gemini-test"
    cliente = _ClienteStream(flujos)
    object.__setattr__(service, "_client", cliente)
    return service, cliente


async def _consumir(service):
    textos = []
    async for texto in service.stream("sistema", [{"role": "user", "content": "hola"}]):
        textos.append(texto)
    return textos


_ALTA_DEMANDA = _Transitorio("503 UNAVAILABLE. This model is currently experiencing high demand.")


@pytest.mark.asyncio
async def test_stream_reintenta_el_503_que_llega_al_leer_el_primer_fragmento():
    service, cliente = _service_stream([_Flujo([_ALTA_DEMANDA]), _Flujo(["Hola", " mundo"])])

    assert await _consumir(service) == ["Hola", " mundo"]
    assert cliente.llamadas == 2


@pytest.mark.asyncio
async def test_stream_reintenta_el_503_al_abrir_como_antes():
    service, cliente = _service_stream([_ALTA_DEMANDA, _Flujo(["ok"])])

    assert await _consumir(service) == ["ok"]
    assert cliente.llamadas == 2


@pytest.mark.asyncio
async def test_stream_ignora_fragmentos_sin_texto_antes_del_primero():
    service, cliente = _service_stream([_Flujo([None, "", "Hola", None, " mundo"])])

    assert await _consumir(service) == ["Hola", " mundo"]
    assert cliente.llamadas == 1


@pytest.mark.asyncio
async def test_stream_no_reintenta_un_error_permanente_en_el_primer_fragmento():
    service, cliente = _service_stream(
        [_Flujo([_Permanente("400 INVALID_ARGUMENT")]), _Flujo(["x"])]
    )

    with pytest.raises(_Permanente):
        await _consumir(service)
    assert cliente.llamadas == 1


@pytest.mark.asyncio
async def test_stream_no_reintenta_si_el_error_llega_despues_del_primer_fragmento():
    # Reintentar duplicaria "Hola" en pantalla: el error se propaga y lo ya emitido se conserva.
    service, cliente = _service_stream(
        [_Flujo(["Hola", _ALTA_DEMANDA]), _Flujo(["Hola", " completo"])]
    )
    textos = []

    with pytest.raises(_Transitorio):
        async for texto in service.stream("sistema", [{"role": "user", "content": "hola"}]):
            textos.append(texto)

    assert textos == ["Hola"]
    assert cliente.llamadas == 1


@pytest.mark.asyncio
async def test_stream_agota_los_reintentos_y_propaga_el_error():
    from src.config.settings import settings

    intentos = settings.llm_max_retries + 1
    service, cliente = _service_stream([_Flujo([_ALTA_DEMANDA]) for _ in range(intentos)])

    with pytest.raises(_Transitorio):
        await _consumir(service)
    assert cliente.llamadas == intentos


@pytest.mark.asyncio
async def test_stream_vacio_no_emite_nada_ni_falla():
    service, cliente = _service_stream([_Flujo([None, ""])])

    assert await _consumir(service) == []
    assert cliente.llamadas == 1
