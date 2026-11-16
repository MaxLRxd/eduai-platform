import { api, API_URL } from "./api";
import type { PlanningClass } from "../types/domain";

export interface PlanningItemApi {
  id: string;
  seccion_id: string | null;
  fecha_clase: string;
  titulo: string;
  contenido: string | null;
  estado: "PLANIFICADO" | "PUBLICADO";
  material_url: string | null;
  material_nombre: string | null;
  material_formato: string | null;
  material_tamano_kb: number | null;
}

function sizeLabel(kb: number | null): string {
  if (kb == null) return "";
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

function toPlanningClass(item: PlanningItemApi, course: string): PlanningClass {
  const fecha = new Date(item.fecha_clase);
  return {
    id: item.id,
    date: Number.isNaN(fecha.getTime()) ? item.fecha_clase : fecha.toISOString().slice(0, 10),
    title: item.titulo,
    course,
    material: item.contenido ?? "",
    studentVisible: item.estado === "PUBLICADO",
    aiEnabled: true,
    sectionId: item.seccion_id,
    attachments: item.material_url
      ? [
          {
            name: item.material_nombre ?? "Material",
            sizeLabel: sizeLabel(item.material_tamano_kb),
            url: item.material_url.startsWith("http") ? item.material_url : `${API_URL}${item.material_url}`,
          },
        ]
      : [],
  };
}

// GET /api/materias/:materiaId/planning — planificación por materia.
export async function getPlanning(courseId: string, courseName: string): Promise<PlanningClass[]> {
  const data = await api<{ items: PlanningItemApi[] }>(`/api/materias/${courseId}/planning`);
  return (data.items ?? []).map((i) => toPlanningClass(i, courseName));
}

// PUT /api/materias/:materiaId/planning/:fecha — crea o actualiza la clase de una fecha.
export async function savePlanning(input: {
  courseId: string;
  date: string;
  title: string;
  material: string;
  studentVisible: boolean;
  sectionId?: string | null;
}): Promise<{ success: boolean }> {
  await api(`/api/materias/${input.courseId}/planning/${input.date}`, {
    method: "PUT",
    body: JSON.stringify({
      titulo: input.title,
      contenido: input.material,
      estado: input.studentVisible ? "PUBLICADO" : "PLANIFICADO",
      seccion_id: input.sectionId ?? undefined,
    }),
  });
  return { success: true };
}

// POST /api/materias/:materiaId/planning/:fecha/material — sube el material de la clase.
export async function uploadPlanningMaterial(input: {
  courseId: string;
  date: string;
  file: File;
}): Promise<void> {
  const form = new FormData();
  form.append("archivo", input.file);
  await api(`/api/materias/${input.courseId}/planning/${input.date}/material`, {
    method: "POST",
    body: form,
  });
}

// POST /api/materias/:materiaId/planning/:fecha/material/desde-contenido — usa un material de Contenidos.
export async function assignPlanningMaterial(input: {
  courseId: string;
  date: string;
  contentId: string;
}): Promise<void> {
  await api(`/api/materias/${input.courseId}/planning/${input.date}/material/desde-contenido`, {
    method: "POST",
    body: JSON.stringify({ contenido_id: input.contentId }),
  });
}

// DELETE /api/materias/:materiaId/planning/:fecha/material — quita el material de la clase.
export async function deletePlanningMaterial(input: {
  courseId: string;
  date: string;
}): Promise<void> {
  await api(`/api/materias/${input.courseId}/planning/${input.date}/material`, {
    method: "DELETE",
  });
}
