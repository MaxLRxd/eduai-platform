"""Caso de uso CU-A13: corrección automática de entregas con rúbrica (Auto-correction Engine)."""

import json
import re

from src.config.settings import settings
from src.prompts.correccion import SYSTEM_PROMPT as CORRECCION_PROMPT
from src.prompts.correccion import SYSTEM_PROMPT_NIVELES
from src.schemas.tutor import CorrectSubmissionRequest, CriterioRubrica, NivelDesempeno
from src.services.embeddings_service import EmbeddingsService
from src.services.llm_service import LLMService
from src.services.retrieval_service import RetrievalService
from src.services.texto import limpiar_markdown
from src.use_cases._helpers import format_context

DEFAULT_RUBRICA = [
    {
        "nombre": "Recuperación del contenido",
        "peso": 40,
        "esperado": "Define correctamente los conceptos principales de la consigna.",
    },
    {
        "nombre": "Claridad y organización",
        "peso": 30,
        "esperado": "La respuesta se entiende, esta ordenada y no se contradice.",
    },
    {
        "nombre": "Cumplimiento de la consigna",
        "peso": 30,
        "esperado": "Responde todo lo que la consigna pide, sin salirse del tema.",
    },
]


def _peso_legible(peso: float) -> str:
    """60.0 -> '60', 62.5 -> '62.5'. El modelo no necesita decimales de relleno."""
    return str(int(peso)) if float(peso).is_integer() else str(peso)


def _formatear_rubrica(criterios: list, niveles: list | None = None) -> str:
    lineas = []
    for c in criterios:
        linea = f"- {c.nombre} (peso {_peso_legible(c.peso)}%)"
        esperado = (getattr(c, "esperado", "") or "").strip()
        if esperado:
            linea += f"\n    Esperado: {esperado}"
        # Descriptores en el orden de los niveles (de mejor a peor), no el del diccionario.
        descriptores = getattr(c, "descriptores", {}) or {}
        for nivel in niveles or []:
            texto = next(
                (v for k, v in descriptores.items() if _clave(k) == _clave(nivel.nombre)), ""
            ).strip()
            if texto:
                linea += f"\n    {nivel.nombre}: {texto}"
        lineas.append(linea)
    texto = "\n".join(lineas)
    if niveles:
        lista = ", ".join(f"{n.nombre} ({_peso_legible(n.puntaje)}%)" for n in niveles)
        texto = f"NIVELES DE DESEMPEÑO (de mejor a peor): {lista}\n\n{texto}"
    return texto


def _clave(texto: str) -> str:
    return (texto or "").strip().lower()


def calificar_por_niveles(
    detalle: list[dict], criterios: list[CriterioRubrica], niveles: list[NivelDesempeno]
) -> tuple[float, list[dict]] | None:
    """Nota 0-10 a partir del nivel de cada criterio: suma de peso x % del nivel.

    Devuelve None si algun criterio quedo sin nivel valido (el modelo omitio un criterio o
    invento un nivel): no se puede calcular una nota confiable y quien llama decide que hacer.
    """
    por_nivel = {_clave(n.nombre): n for n in niveles}
    por_criterio = {_clave(str(d.get("nombre", ""))): d for d in detalle if isinstance(d, dict)}

    resueltos: list[dict] = []
    puntos = 0.0
    for criterio in criterios:
        d = por_criterio.get(_clave(criterio.nombre))
        nivel = por_nivel.get(_clave(str(d.get("nivel", "")))) if d else None
        if d is None or nivel is None:
            return None
        puntos += criterio.peso * nivel.puntaje / 100.0
        resueltos.append(
            {
                "nombre": criterio.nombre,
                "nivel": nivel.nombre,
                "puntaje": nivel.puntaje,
                "comentario": limpiar_markdown(str(d.get("comentario", ""))),
            }
        )

    total_peso = sum(c.peso for c in criterios) or 100.0
    return round(max(0.0, min(10.0, puntos / total_peso * 10.0)), 2), resueltos


class CorreccionEntregaUseCase:
    def __init__(
        self,
        llm: LLMService,
        embeddings: EmbeddingsService,
        retrieval: RetrievalService,
    ):
        self.llm = llm
        self.embeddings = embeddings
        self.retrieval = retrieval

    async def execute(self, req: CorrectSubmissionRequest) -> dict:
        query = " ".join([req.consigna, req.entrega])
        embedding = await self.embeddings.embed_query(query)
        results = await self.retrieval.search(req.subject_id, embedding, settings.retrieval_top_k)
        context = format_context(results)

        rubrica = list(req.rubrica) or [
            CriterioRubrica(**c) for c in DEFAULT_RUBRICA
        ]
        niveles = list(req.niveles)
        rubrica_txt = _formatear_rubrica(rubrica, niveles)

        user_content = (
            f"CONSIGNA DE LA ACTIVIDAD:\n{req.consigna or '(sin consigna cargada)'}\n\n"
            f"ENTREGA DEL ALUMNO:\n{req.entrega[:12000]}\n\n"
            f"RÚBRICA:\n{rubrica_txt}\n\n"
            f"CONTEXTO (material de la cátedra):\n"
            f"{context or '(no hay material indexado disponible para esta materia)'}\n\n"
            f"Devolvé únicamente el JSON."
        )
        raw = await self.llm.generate(
            SYSTEM_PROMPT_NIVELES if niveles else CORRECCION_PROMPT,
            [{"role": "user", "content": user_content}],
            temperature=0.2,
            max_tokens=2048,
        )
        return self._parse(raw, rubrica, niveles)

    def _parse(
        self,
        raw: str,
        rubrica: list[CriterioRubrica] | None = None,
        niveles: list[NivelDesempeno] | None = None,
    ) -> dict:
        cleaned = raw.strip()
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()
        start, end = cleaned.find("{"), cleaned.rfind("}")
        if start == -1 or end == -1:
            raise ValueError("El modelo no devolvió un JSON válido para la corrección.")
        payload = json.loads(cleaned[start : end + 1])

        feedback = limpiar_markdown(str(payload.get("feedback", "")))
        if not feedback:
            raise ValueError("El modelo no devolvió feedback para la corrección.")

        if niveles and rubrica:
            resultado = calificar_por_niveles(
                payload.get("detalle_por_criterio") or [], rubrica, niveles
            )
            if resultado is not None:
                calificacion, detalle = resultado
                resumen = "\n".join(
                    f"- {d['nombre']}: {d['nivel']} ({_peso_legible(d['puntaje'])}%)"
                    for d in detalle
                )
                return {
                    "feedback": f"{feedback}\n\nNiveles alcanzados:\n{resumen}",
                    "calificacion": calificacion,
                    "detalle_por_criterio": detalle,
                }
            # El modelo omitio un criterio o invento un nivel: sin una nota por niveles confiable,
            # se usa la que haya dado; si tampoco dio ninguna, es un error (no se inventa una nota).
            if "calificacion" not in payload:
                raise ValueError(
                    "El modelo no indicó el nivel de todos los criterios de la rúbrica."
                )

        calificacion = max(0.0, min(10.0, float(payload.get("calificacion", 0))))
        return {"feedback": feedback, "calificacion": round(calificacion, 2)}
