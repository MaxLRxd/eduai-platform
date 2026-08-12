"""Router RAG: indexación y eliminación de materiales (alimenta el tutor IA)."""

from fastapi import APIRouter, HTTPException, Request

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


@router.delete("/material/{subject_id}/{material_id}")
async def delete_material(subject_id: str, material_id: str, request: Request) -> dict:
    await request.app.state.retrieval_service.delete_material(subject_id, material_id)
    return {"material_id": material_id, "deleted": True}
