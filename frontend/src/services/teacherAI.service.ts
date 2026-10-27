import { api } from "./api";

export async function askTeacherAssistant(
  prompt: string,
  materiaId: string,
  classDate?: string
): Promise<string> {
  const data = await api<{ material: string }>("/api/asistente/generar", {
    method: "POST",
    body: JSON.stringify({
      materia_id: materiaId,
      prompt,
      ...(classDate ? { class_date: classDate } : {}),
    }),
  });
  return data.material;
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
