from src.services.texto import limpiar_markdown


def test_quita_negritas_cursivas_y_backticks():
    assert limpiar_markdown("**Hola** *mundo* y `código`") == "Hola mundo y código"


def test_quita_encabezados_pero_conserva_vinetas():
    assert limpiar_markdown("## Título\n- uno\n* dos") == "Título\n- uno\n* dos"


def test_puede_conservar_encabezados_para_material():
    assert limpiar_markdown("## Tema\n**Texto**", permitir_encabezados=True) == "## Tema\nTexto"


def test_texto_vacio_se_devuelve_igual():
    assert limpiar_markdown("") == ""
