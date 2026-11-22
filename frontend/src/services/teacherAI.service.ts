import { api } from "./api";

export interface FuenteMaterial {
  material_id: string;
  titulo?: string | null;
  chunk_index?: number;
  content: string;
  score: number;
}

export interface SesionDocenteApi {
  id: string;
  materia_id: string;
  titulo: string | null;
  iniciada_en: string;
  cerrada_en: string | null;
  mensajes: number;
}

export interface MensajeDocenteApi {
  id: string;
  rol: "USER" | "ASSISTANT";
  contenido: string;
  sources: FuenteMaterial[];
  creado_en: string;
}

export interface MensajeDocenteInput {
  prompt: string;
  class_date?: string;
  content_ids?: string[];
}

export async function askTeacherAssistant(
  prompt: string,
  materiaId: string,
  classDate?: string,
  contentIds?: string[]
): Promise<string> {
  const data = await api<{ material: string }>("/api/asistente/generar", {
    method: "POST",
    body: JSON.stringify({
      materia_id: materiaId,
      prompt,
      ...(classDate ? { class_date: classDate } : {}),
      ...(contentIds?.length ? { content_ids: contentIds } : {}),
    }),
  });
  return data.material;
}

export async function listarSesionesDocente(materiaId: string): Promise<SesionDocenteApi[]> {
  return api<SesionDocenteApi[]>(`/api/asistente/sesiones?materia_id=${encodeURIComponent(materiaId)}`);
}

export async function crearSesionDocente(materiaId: string): Promise<SesionDocenteApi> {
  return api<SesionDocenteApi>("/api/asistente/sesiones", {
    method: "POST",
    body: JSON.stringify({ materia_id: materiaId }),
  });
}

export async function listarMensajesDocente(sesionId: string): Promise<MensajeDocenteApi[]> {
  return api<MensajeDocenteApi[]>(`/api/asistente/sesiones/${sesionId}/mensajes`);
}

export async function enviarMensajeDocente(
  sesionId: string,
  input: MensajeDocenteInput
): Promise<MensajeDocenteApi> {
  return api<MensajeDocenteApi>(`/api/asistente/sesiones/${sesionId}/mensajes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface MaterialPdfResult {
  filename: string;
  pdf: string;
}

export async function exportMaterialPdf(
  material: string,
  materiaId: string,
  titulo?: string
): Promise<MaterialPdfResult> {
  return api<MaterialPdfResult>("/api/asistente/pdf", {
    method: "POST",
    body: JSON.stringify({ materia_id: materiaId, material, ...(titulo ? { titulo } : {}) }),
  });
}

export function downloadMaterialPdf(result: MaterialPdfResult): void {
  const bytes = Uint8Array.from(atob(result.pdf), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
