import { api } from "./api";
import type { CorrectionQueueItem, Rubric } from "../types/domain";

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

interface RubricaApi {
  id: string;
  nombre: string;
  descripcion: string | null;
  criterios: { nombre: string; peso: number; esperado?: string }[];
  actividades: number;
}

export interface RubricCriterionInput {
  nombre: string;
  peso: number;
  esperado: string;
}

export interface RubricInput {
  nombre: string;
  descripcion?: string;
  criterios: RubricCriterionInput[];
}

function toRubric(r: RubricaApi): Rubric {
  return {
    id: r.id,
    name: r.nombre,
    description: r.descripcion,
    criteriaCount: (r.criterios ?? []).length,
    activitiesCount: r.actividades,
    criterios: (r.criterios ?? []).map((c) => ({
      name: c.nombre,
      weight: `${c.peso}%`,
      expected: c.esperado ?? "",
    })),
  };
}

export async function getCorrectionQueue(): Promise<CorrectionQueueItem[]> {
  const data = await api<{ entregas: EntregaPendiente[] }>(`/api/entregas/pendientes`);
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
    materiaId: e.materia?.id ?? e.actividad.seccion.materia.id,
  }));
}

export async function getRubrics(materiaId: string): Promise<Rubric[]> {
  if (!materiaId) return [];
  const data = await api<{ rubricas: RubricaApi[] }>(`/api/materias/${materiaId}/rubricas`);
  return (data.rubricas ?? []).map(toRubric);
}

export async function createRubric(materiaId: string, input: RubricInput): Promise<Rubric> {
  const data = await api<{ rubrica: RubricaApi }>(`/api/materias/${materiaId}/rubricas`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return toRubric(data.rubrica);
}

export async function updateRubric(rubricId: string, input: Partial<RubricInput>): Promise<Rubric> {
  const data = await api<{ rubrica: RubricaApi }>(`/api/rubricas/${rubricId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return toRubric(data.rubrica);
}

export async function deleteRubric(rubricId: string): Promise<void> {
  await api(`/api/rubricas/${rubricId}`, { method: "DELETE" });
}

/** CU-A07: pide al backend una correccion sugerida por IA y la deja como borrador. */
export async function correctWithAi(entregaId: string): Promise<{ grade: string; feedback: string }> {
  const data = await api<{
    entrega: { calificacion_ia: number | null; feedback_ia: string | null };
  }>(`/api/entregas/${entregaId}/corregir-ia`, { method: "POST" });

  if (data.entrega.feedback_ia == null) {
    throw new Error("La IA no devolvio feedback para esta entrega");
  }

  return {
    grade: data.entrega.calificacion_ia != null ? String(data.entrega.calificacion_ia) : "",
    feedback: data.entrega.feedback_ia,
  };
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