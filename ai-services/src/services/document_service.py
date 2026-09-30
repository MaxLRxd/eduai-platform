"""Extracción de texto de documentos (PDF, DOCX, PPTX, TXT, imágenes)."""

import io

import docx
import pptx
import pypdf
import structlog

from src.services.ocr_service import MINIMO_CARACTERES_PDF, OcrService

logger = structlog.get_logger(__name__)


class DocumentService:
    def __init__(self, ocr: OcrService | None = None):
        # OCR opcional (CU-P02): sin tesseract instalado el servicio sigue
        # funcionando para el resto de los formatos, solo que las imagenes
        # devuelven "" y el material no se indexa.
        self.ocr = ocr or OcrService()

    def extract_text(self, data: bytes, filename: str = "") -> str:
        ext = (filename.rsplit(".", 1)[-1] if "." in filename else "").lower()
        try:
            if ext == "pdf" or data[:4] == b"%PDF":
                return self._from_pdf(data)
            if self.ocr.es_imagen(ext):
                return self.ocr.extract_from_image(data)
            if ext in ("docx", "doc"):
                return self._from_docx(data)
            if ext in ("pptx", "ppt"):
                return self._from_pptx(data)
            if ext == "txt" or ext in ("md", "csv"):
                return data.decode("utf-8", errors="ignore").strip()
            if ext in ("svg", "webm", "mp4", "mov", "avi"):
                # Sin capa de texto y sin OCR posible. Antes estos caian al
                # decode final y devolvian el XML o los bytes del video, que
                # terminaba indexado en el vector store como si fuera material.
                return ""
            if data[:2] == b"PK":
                text = self._from_docx(data)
                if not text:
                    text = self._from_pptx(data)
                return text
            return self._from_bytes_desconocidos(data)
        except Exception as exc:
            logger.warning("document_extract_failed", filename=filename, error=str(exc))
            return ""

    @staticmethod
    def _from_bytes_desconocidos(data: bytes) -> str:
        """Ultimo recurso: solo acepta algo que parezca texto de verdad.

        Sin este filtro, cualquier binario desconocido terminaba decodificado
        con errors="ignore" y sus bytes basura se indexaban como contenido.
        """
        texto = data.decode("utf-8", errors="replace").strip()
        if not texto:
            return ""
        # Caracteres de reemplazo o de control = binario, no es material.
        suspectos = sum(1 for c in texto if c == "\ufffd" or (ord(c) < 32 and c not in "\n\r\t"))
        if suspectos / len(texto) > 0.05:
            return ""
        return texto

    def _from_pdf(self, data: bytes) -> str:
        reader = pypdf.PdfReader(io.BytesIO(data))
        pages = [(page.extract_text() or "") for page in reader.pages]
        texto = "\n".join(pages).strip()

        # PDF escaneado: la capa de texto viene vacia o con alguno que el OCR no
        # puede leer. Si hay pocas paginas y sale casi nada, probamos por imagen.
        if self._parece_escaneado(reader, texto):
            logger.info("pdf_escanizado_va_a_ocr", paginas=len(reader.pages))
            texto_ocr = self.ocr.extract_from_pdf(data)
            if texto_ocr:
                return texto_ocr

        return texto

    @staticmethod
    def _parece_escaneado(reader: "pypdf.PdfReader", texto: str) -> bool:
        if len(texto) >= MINIMO_CARACTERES_PDF:
            return False
        # Un PDF de una sola pagina puede ser una imagen suelta: igual conviene
        # pasarle OCR, el costo es bajo comparado con devolver texto vacio.
        return len(reader.pages) > 0

    def _from_docx(self, data: bytes) -> str:
        document = docx.Document(io.BytesIO(data))
        paragraphs = [paragraph.text for paragraph in document.paragraphs if paragraph.text]
        return "\n".join(paragraphs).strip()

    def _from_pptx(self, data: bytes) -> str:
        presentation = pptx.Presentation(io.BytesIO(data))
        parts: list[str] = []
        for slide in presentation.slides:
            for shape in slide.shapes:
                if shape.has_text_frame:
                    text = shape.text_frame.text.strip()
                    if text:
                        parts.append(text)
        return "\n".join(parts).strip()
