"""Tests del OCR (CU-P02). No requieren tesseract instalado: se simula el binario."""

import io

import pytest

from src.services.document_service import DocumentService
from src.services.ocr_service import OcrService


def _png_1px() -> bytes:
    """Un PNG valido minimo, generado con Pillow si esta disponible."""
    try:
        from PIL import Image
    except ImportError:
        return b""
    buffer = io.BytesIO()
    Image.new("RGB", (1, 1), "white").save(buffer, format="PNG")
    return buffer.getvalue()


def _pdf_con_texto(texto: str) -> bytes:
    """PDF de una pagina con capa de texto real, armado con pypdf."""
    pypdf = pytest.importorskip("pypdf")
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=200, height=200)
    buffer = io.BytesIO()
    writer.write(buffer)
    datos = buffer.getvalue()
    # pypdf no escribe texto facilmente; usamos el truco de la capa de texto via
    # un PDF minimo con la clase que pypdf sabe generar solo si le pasamos texto.
    return datos


class TestDisponibilidad:
    def test_sin_binario_devuelve_falso_y_no_revisa_en_cada_llamada(self, monkeypatch):
        import shutil

        llamadas: list[int] = []

        def which(_nombre: str) -> None:
            llamadas.append(1)
            return None

        monkeypatch.setattr(shutil, "which", which)
        servicio = OcrService()

        assert servicio.disponible is False
        assert servicio.disponible is False
        # La busqueda se cachea: solo se consulta una vez.
        assert len(llamadas) == 1

    def test_con_binario_devuelve_true(self, monkeypatch):
        import shutil

        monkeypatch.setattr(shutil, "which", lambda _n: "/usr/bin/tesseract")
        assert OcrService().disponible is True

    def test_sin_motor_devuelve_texto_vacio_en_vez_de_raising(self, monkeypatch):
        import shutil

        monkeypatch.setattr(shutil, "which", lambda _n: None)
        servicio = OcrService()

        assert servicio.extract_from_image(b"cualquier cosa") == ""
        assert servicio.extract_from_pdf(b"%PDF-1.4") == ""


class TestLimpieza:
    def test_colapsa_espacios_y_saca_lineas_vacias(self):
        texto = "Hola    mundo  \n\n\n Segunda   linea \n\n"
        assert OcrService._limpiar(texto) == "Hola mundo\nSegunda linea"

    def test_texto_vacio_devuelve_vacio(self):
        assert OcrService._limpiar("   \n\n  ") == ""


class TestFormatosSoportados:
    @pytest.mark.parametrize("extension", ["png", "JPG", "jpeg", "gif", "webp", "bmp", "tiff"])
    def test_reconoce_formatos_de_imagen(self, extension):
        assert OcrService().es_imagen(extension) is True

    def test_svg_no_se_pasa_a_ocr(self):
        # SVG es XML vectorial: PIL no lo abre y no hay pixeles que reconocer.
        assert OcrService().es_imagen("svg") is False

    def test_pdf_no_es_imagen(self):
        assert OcrService().es_imagen("pdf") is False


class TestIntegracionConDocumentService:
    def test_imagen_se_manda_al_ocr(self):
        class OcrFalso:
            def es_imagen(self, extension: str) -> bool:
                return extension in ("png", "jpg")

            def extract_from_image(self, data: bytes) -> str:
                return "texto leido por ocr"

        servicio = DocumentService(ocr=OcrFalso())
        assert servicio.extract_text(b"falso", "apunte.png") == "texto leido por ocr"

    def test_svg_devuelve_vacio_sin_intentar_ocr(self):
        # El SVG es XML vectorial: si se decodea y se indexa, el RAG termina
        # guardando el codigo fuente del SVG como si fuera contenido docente.
        servicio = DocumentService()
        assert servicio.extract_text(b"<svg><rect/></svg>", "logo.svg") == ""

    def test_binario_desconocido_no_se_indexa_como_texto(self):
        # Sin el filtro de binarios, los bytes de un .mp4 o .zip desconocido
        # terminaban decodificados con errors="ignore" dentro del vector store.
        servicio = DocumentService()
        binario = bytes(range(0, 256)) * 4
        assert servicio.extract_text(binario, "archivo.bin") == ""

    def test_texto_desconocido_si_se_acepta(self):
        # Lo contrario del test anterior: un .md sin extensión conocida es
        # texto legitimo y tiene que pasar.
        servicio = DocumentService()
        assert servicio.extract_text("Contenido del apunte".encode("utf-8"), "apunte") != ""

    def test_txt_no_pasa_por_ocr(self):
        servicio = DocumentService()
        texto = " ".join(["palabra"] * 40)
        assert servicio.extract_text(texto.encode("utf-8"), "notas.txt") == texto

    def test_docx_sigue_funcionando(self):
        docx = pytest.importorskip("docx")
        documento = docx.Document()
        documento.add_paragraph("Contenido real del documento")
        buffer = io.BytesIO()
        documento.save(buffer)

        servicio = DocumentService()
        texto = servicio.extract_text(buffer.getvalue(), "clase.docx")
        assert "Contenido real" in texto

    def test_sin_ocr_instalado_no_rompe_el_texto_plano(self, monkeypatch):
        import shutil

        monkeypatch.setattr(shutil, "which", lambda _n: None)
        servicio = DocumentService()
        texto = " ".join(["palabra"] * 40)
        assert servicio.extract_text(texto.encode("utf-8"), "notas.txt") == texto
