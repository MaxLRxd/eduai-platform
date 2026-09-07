import { api } from "./api";
import type { PlanningClass } from "../types/domain";

export interface PlanningItemApi {
  id: string;
  fecha_clase: string;
  titulo: string;
  contenido: string | null;
  estado: "PLANIFICADO" | "PUBLICADO";
}

function toPlanningClass(item: PlanningItemApi, course: string): PlanningClass {
  const fecha = new Date(item.fecha_clase);
  return {
    date: Number.isNaN(fecha.getTime()) ? item.fecha_clase : fecha.toISOString().slice(0, 10),
    title: item.titulo,
    course,
    material: item.contenido ?? "",
    studentVisible: item.estado === "PUBLICADO",
    aiEnabled: true,
    attachments: [],
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
}): Promise<{ success: boolean }> {
  await api(`/api/materias/${input.courseId}/planning/${input.date}`, {
    method: "PUT",
    body: JSON.stringify({
      titulo: input.title,
      contenido: input.material,
      estado: input.studentVisible ? "PUBLICADO" : "PLANIFICADO",
    }),
  });
  return { success: true };
}