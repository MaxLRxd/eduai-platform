"""Router del tutor IA: chat, streaming SSE, resúmenes, simulacros y depuración."""

import json

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from src.schemas.tutor import (
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
            yield 'event: done\ndata: {}\n\n'
        except Exception as exc:
            payload = json.dumps({"error": str(exc)}, ensure_ascii=False)
            yield f"event: error\ndata: {payload}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


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


@router.post("/generar-material", response_model=MaterialResponse)
async def generar_material(req: MaterialRequest, request: Request) -> MaterialResponse:
    try:
        result = await request.app.state.generar_material_use_case.execute(
            req.subject_id, req.prompt
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
