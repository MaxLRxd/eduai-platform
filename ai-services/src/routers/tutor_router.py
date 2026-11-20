"""Router del tutor IA: chat, streaming SSE, resúmenes, simulacros y depuración."""

import asyncio
import json

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse

from src.schemas.tutor import (
    CorrectExamRequest,
    CorrectExamResponse,
    CorrectSubmissionRequest,
    CorrectSubmissionResponse,
    DepurarPromptRequest,
    DepurarPromptResponse,
    ExamRequest,
    ExamResponse,
    MaterialRequest,
    MaterialResponse,
    SummaryRequest,
    SummaryResponse,
    TutorRequest,
    TutorResponse,
)

router = APIRouter(prefix="/tutor", tags=["tutor"])

# Tope defensivo: el backend ya limita el tamaño; esto evita leer en memoria algo enorme
# si alguien llama directo.
LIMITE_BYTES_EXTRACCION = 15 * 1024 * 1024


@router.post("/chat", response_model=TutorResponse)
async def chat(req: TutorRequest, request: Request) -> TutorResponse:
    try:
        result = await request.app.state.ask_tutor_use_case.execute(req)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error del proveedor de IA: {exc}") from exc
    return TutorResponse(**result)


@router.post("/chat/stream")
async def chat_stream(req: TutorRequest, request: Request) -> StreamingResponse:
    async def event_stream():
        try:
            async for event in request.app.state.ask_tutor_use_case.stream(req):
                payload = json.dumps(event, ensure_ascii=False)
                yield f"data: {payload}\n\n"
            yield "event: done\ndata: {}\n\n"
        except Exception as exc:
            payload = json.dumps({"error": str(exc)}, ensure_ascii=False)
            yield f"event: error\ndata: {payload}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/extraer-texto")
async def extraer_texto(request: Request, archivo: UploadFile = File(...)) -> dict:
    """Devuelve el texto de un archivo (PDF, DOCX, PPTX, TXT, imagen) SIN guardarlo ni indexarlo.

    Lo usa el backend para resumir un archivo propio del alumno: el contenido pasa por acá
    y se descarta.
    """
    try:
        data = await archivo.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"No se pudo leer el archivo: {exc}") from exc

    if not data:
        raise HTTPException(status_code=400, detail="El archivo está vacío.")
    if len(data) > LIMITE_BYTES_EXTRACCION:
        raise HTTPException(status_code=413, detail="El archivo es demasiado grande.")

    texto = await asyncio.to_thread(
        request.app.state.document_service.extract_text, data, archivo.filename or ""
    )
    if not texto.strip():
        raise HTTPException(
            status_code=422,
            detail=(
                "No se pudo extraer texto del archivo "
                "(puede estar escaneado, vacío o en un formato no soportado)."
            ),
        )
    return {"texto": texto, "caracteres": len(texto)}


@router.post("/resumen", response_model=SummaryResponse)
async def resumen(req: SummaryRequest, request: Request) -> SummaryResponse:
    try:
        summary = await request.app.state.resumir_use_case.execute(
            req.text, req.language, req.max_words
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error del proveedor de IA: {exc}") from exc
    return SummaryResponse(summary=summary)


@router.post("/examen", response_model=ExamResponse)
async def examen(req: ExamRequest, request: Request) -> ExamResponse:
    try:
        return await request.app.state.examen_use_case.execute(req)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error del proveedor de IA: {exc}") from exc


@router.post("/examen/corregir", response_model=CorrectExamResponse)
async def corregir_examen(req: CorrectExamRequest, request: Request) -> CorrectExamResponse:
    try:
        return await request.app.state.corregir_simulacro_use_case.execute(req)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error del proveedor de IA: {exc}") from exc


@router.post("/generar-material", response_model=MaterialResponse)
async def generar_material(req: MaterialRequest, request: Request) -> MaterialResponse:
    try:
        result = await request.app.state.generar_material_use_case.execute(
            req.subject_id, req.prompt, req.material_titles
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error del proveedor de IA: {exc}") from exc
    return MaterialResponse(**result)


@router.post("/corregir-entrega", response_model=CorrectSubmissionResponse)
async def corregir_entrega(
    req: CorrectSubmissionRequest, request: Request
) -> CorrectSubmissionResponse:
    try:
        result = await request.app.state.correccion_use_case.execute(req)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error del proveedor de IA: {exc}") from exc
    return CorrectSubmissionResponse(**result)


@router.post("/depurar", response_model=DepurarPromptResponse)
async def depurar(req: DepurarPromptRequest, request: Request) -> DepurarPromptResponse:
    result = request.app.state.depurar_prompt_use_case.execute(req.prompt)
    return DepurarPromptResponse(**result)
