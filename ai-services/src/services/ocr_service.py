"""Servicio de OCR para CU-P02: imagenes y PDF escaneado.

Usa tesseract via pytesseract. Si el binario no esta disponible (entorno local
sin tesseract, imagen de Docker vieja) el servicio degrada en silencio: devuelve
texto vacio y el material queda sin indexar, en vez de romper el arranque.
"""

import io
import shutil

import structlog

logger = structlog.get_logger(__name__)

# Idiomas que se piden a tesseract. "spa" primero: el dominio es argentino.
IDIOMAS = "spa+eng"

# Formatos que tesseract/PIL pueden abrir. SVG queda fuera a proposito: es XML
# vectorial, PIL no lo renderiza y no hay nada que "reconocer".
EXTENSIONES_SOPORTADAS = ("png", "jpg", "jpeg", "gif", "webp", "bmp", "tif", "tiff")

# Un PDF escaneado devuelve una capa de texto con unos pocos caracteres basura.
# Si extraemos menos que esto y tiene varias paginas,probamos OCR.
MINIMO_CARACTERES_PDF = 24


class OcrService:
    def __init__(self, idiomas: str = IDIOMAS, dpi: int = 300):
        self.idiomas = idiomas
        self.dpi = dpi
        self._disponible: bool | None = None

    @property
    def disponible(self) -> bool:
        """True si el binario de tesseract esta instalado. Se cachea el resultado."""
        if self._disponible is None:
            self._disponible = bool(shutil.which("tesseract"))
            if not self._disponible:
                logger.warning("tesseract_no_disponible")
        return self._disponible

    def extract_from_image(self, data: bytes) -> str:
        """Transcribe una imagen a texto. Devuelve "" si no se puede."""
        if not data or not self.disponible:
            return ""

        try:
            import pytesseract
            from PIL import Image, UnidentifiedImageError
        except ImportError:
            logger.warning("pytesseract_no_instalado")
            return ""

        try:
            with Image.open(io.BytesIO(data)) as image:
                # Los PNG con transparencia y los modos exoticos hacen fallar a tesseract.
                if image.mode not in ("L", "RGB"):
                    image = image.convert("RGB")
                texto = pytesseract.image_to_string(image, lang=self.idiomas)
            return self._limpiar(texto)
        except (UnidentifiedImageError, OSError, ValueError) as exc:
            logger.warning("ocr_imagen_fallo", error=str(exc))
            return ""
        except Exception as exc:
            logger.warning("ocr_imagen_error_inesperado", error=str(exc))
            return ""

    def extract_from_pdf(self, data: bytes, max_paginas: int = 10) -> str:
        """Transcribe un PDF escaneado rasterizando sus paginas. Devuelve "" si falla."""
        if not data or not self.disponible:
            return ""

        try:
            from pdf2image import convert_from_bytes
        except ImportError:
            logger.warning("pdf2image_no_instalado")
            return ""

        try:
            paginas = convert_from_bytes(data, dpi=self.dpi, first_page=1, last_page=max_paginas)
        except Exception as exc:
            logger.warning("ocr_pdf_rasterizado_fallo", error=str(exc))
            return ""

        partes: list[str] = []
        for numero, pagina in enumerate(paginas, start=1):
            try:
                import pytesseract

                texto = pytesseract.image_to_string(pagina, lang=self.idiomas)
            except Exception as exc:
                logger.warning("ocr_pdf_pagina_fallo", pagina=numero, error=str(exc))
                continue
            limpio = self._limpiar(texto)
            if limpio:
                partes.append(f"[pagina {numero}]\n{limpio}")

        return "\n\n".join(partes).strip()

    def es_imagen(self, extension: str) -> bool:
        return extension.lower() in EXTENSIONES_SOPORTADAS

    @staticmethod
    def _limpiar(texto: str) -> str:
        """Quita el ruido tipico de tesseract: lineas en blanco repetidas y espacios multiples."""
        lineas = [" ".join(linea.split()) for linea in texto.splitlines()]
        return "\n".join(linea for linea in lineas if linea).strip()
