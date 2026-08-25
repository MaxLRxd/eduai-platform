import type { UploadedMaterial } from "../types/domain";
import { MOCK_UPLOADED_MATERIALS } from "../data/mock/content.mock";

// TODO(backend): GET /api/courses/:id/materials — dispara index_material.py en el ai-service (RAG Pipeline).
export async function getUploadedMaterials(): Promise<UploadedMaterial[]> {
  return Promise.resolve(MOCK_UPLOADED_MATERIALS);
}

// TODO(backend): POST /api/courses/:id/materials (multipart) — sube a R2 y encola la indexación RAG.
export async function uploadMaterial(name: string): Promise<UploadedMaterial> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { name, fileType: "pdf", sizeLabel: "—", ragStatus: "Indexando…", date: new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) };
}
