"""Router RAG: indexación y eliminación de materiales (alimenta el tutor IA)."""

import asyncio

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from src.schemas.tutor import IndexMaterialRequest, IndexMaterialResponse

router = APIRouter(prefix="/rag", tags=["rag"])


@router.post("/material", response_model=IndexMaterialResponse)
async def index_material(req: IndexMaterialRequest, request: Request) -> IndexMaterialResponse:
    try:
        result = await request.app.state.index_material_use_case.execute(
            req.subject_id, req.material_id, req.text
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error al indexar el material: {exc}") from exc
    return IndexMaterialResponse(**result)


@router.post("/material/archivo", response_model=IndexMaterialResponse)
async def index_material_file(
    request: Request,
    subject_id: str = Form(...),
    material_id: str = Form(...),
    archivo: UploadFile = File(...),
) -> IndexMaterialResponse:
    try:
        data = await archivo.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"No se pudo leer el archivo: {exc}") from exc

    if not data:
        raise HTTPException(status_code=400, detail="El archivo está vacío.")

    filename = archivo.filename or ""
    document = request.app.state.document_service
    text = await asyncio.to_thread(document.extract_text, data, filename)

    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail="No se pudo extraer texto del archivo para indexar en el RAG.",
        )

    try:
        result = await request.app.state.index_material_use_case.execute(
            subject_id, material_id, text
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error al indexar el archivo: {exc}") from exc
    return IndexMaterialResponse(**result)


@router.delete("/material/{subject_id}/{material_id}")
async def delete_material(subject_id: str, material_id: str, request: Request) -> dict:
    await request.app.state.retrieval_service.delete_material(subject_id, material_id)
    return {"material_id": material_id, "deleted": True}
