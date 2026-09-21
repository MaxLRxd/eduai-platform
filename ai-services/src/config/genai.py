from google import genai

_client = None
_api_key = None


def get_genai_client(api_key: str) -> genai.Client:
    """Devuelve el cliente compartido de Gemini, creado de forma perezosa.

    Si la clave está vacía, no crea el cliente y falla con un error claro
    (para que el servicio pueda arrancar sin GEMINI_API_KEY y el fallo sea
    por endpoint, no al boot).
    """
    global _client, _api_key
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY no configurada. El proveedor de IA no está disponible."
        )
    if _client is None or _api_key != api_key:
        _client = genai.Client(api_key=api_key)
        _api_key = api_key
    return _client
