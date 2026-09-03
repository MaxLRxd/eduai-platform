import { api } from "./api";
import type { CorrectionQueueItem, Rubric, RubricCriterion } from "../types/domain";

interface EntregaPendiente {
  id: string;
  alumno: { id: string; nombre: string; email: string } | null;
  actividad: {
    id: string;
    nombre: string;
    tipo: "MULTIPLE_CHOICE" | "DESARROLLO" | "ARCHIVO" | "CODIGO";
    seccion: { materia: { id: string; nombre: string } };
  };
  materia: { id: string; nombre: string };
  respuesta_texto: string | null;
  respuesta_codigo: string | null;
  archivo_nombre: string | null;
  calificacion_ia: number | null;
  feedback_ia: string | null;
}

const TYPE_LABEL: Record<EntregaPendiente["actividad"]["tipo"], string> = {
  MULTIPLE_CHOICE: "Múltiple choice",
  DESARROLLO: "Desarrollo",
  ARCHIVO: "Archivo",
  CODIGO: "Código",
};

export async function getCorrectionQueue(): Promise<CorrectionQueueItem[]> {
  const uuid = "00000000-0000-4000-8000-000000000000";
  const data = await api<{ entregas: EntregaPendiente[] }>(`/api/actividades/${uuid}/entregas/pendientes`);
  return (data.entregas ?? []).map((e) => ({
    id: e.id,
    student: e.alumno?.nombre ?? "—",
    activity: e.actividad.nombre,
    course: e.materia?.nombre ?? e.actividad.seccion.materia.nombre,
    type: TYPE_LABEL[e.actividad.tipo] ?? e.actividad.tipo,
    aiGrade: e.calificacion_ia != null ? String(e.calificacion_ia) : "—",
    submission:
      e.respuesta_texto ?? e.respuesta_codigo ?? (e.archivo_nombre ? `📎 ${e.archivo_nombre}` : "Sin contenido"),
    aiFeedback: e.feedback_ia ?? "Corrección IA aún no disponible para esta entrega.",
  }));
}

export async function getRubricCriteria(): Promise<RubricCriterion[]> {
  return [];
}

export async function getRubrics(): Promise<Rubric[]> {
  return [];
}

export async function publishCorrection(input: {
  entregaId: string;
  grade: string;
  feedback: string;
}): Promise<{ success: boolean }> {
  await api(`/api/entregas/${input.entregaId}/correccion`, {
    method: "PATCH",
    body: JSON.stringify({
      calificacion_final: Number(input.grade),
      feedback_final: input.feedback,
      revision_tipo: "MANUAL",
    }),
  });
  return { success: true };
}