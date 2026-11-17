"""Limpieza de marcas markdown que el chat muestra como texto plano."""

import re


def limpiar_markdown(texto: str, permitir_encabezados: bool = False) -> str:
    """Quita negritas, cursivas, backticks y encabezados del texto del modelo."""
    if not texto:
        return texto

    limpio = texto.replace("\r\n", "\n")
    limpio = re.sub(r"```[^\n]*\n?", "", limpio)
    limpio = re.sub(r"`([^`]+)`", r"\1", limpio)
    limpio = re.sub(r"\*\*(.+?)\*\*", r"\1", limpio)
    limpio = re.sub(r"__(.+?)__", r"\1", limpio)
    # Cursiva *texto* sin tocar viñetas que empiezan con "* ".
    limpio = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"\1", limpio)
    if not permitir_encabezados:
        limpio = re.sub(r"(?m)^#{1,6}\s+", "", limpio)
    limpio = re.sub(r"\n{3,}", "\n\n", limpio)
    return limpio.strip()
