import { api } from "./api";
import type { AssignmentOption, AssignmentType } from "../types/domain";

export interface TeacherActivity {
  id: string;
  seccion_id: string;
  seccion: { id: string; nombre: string; tipo: string } | null;
  nombre: string;
  consigna: string;
  tipo: AssignmentType;
  opciones_mc: AssignmentOption[] | null;
  formatos_permitidos: string | null;
  fecha_limite: string;
  correccion_manual: boolean;
  rubrica_id: string | null;
  rubrica: { id: string; nombre: string } | null;
  activo: boolean;
  entregasCount: number;
}

export interface ActivityInput {
  seccion_id: string;
  /** `null` desvincula la rubrica de la actividad. */
  rubrica_id?: string | null;
  nombre: string;
  consigna: string;
  tipo: AssignmentType;
  opciones_mc?: AssignmentOption[];
  formatos_permitidos?: string;
  fecha_limite: string;
  correccion_manual: boolean;
  activo?: boolean;
}

const TIPO_LABEL: Record<AssignmentType, string> = {
  MULTIPLE_CHOICE: "Opción múltiple",
  DESARROLLO: "Desarrollo escrito",
  ARCHIVO: "Archivo",
  CODIGO: "Código",
};

export const TIPO_ACTIVIDAD_LABEL = TIPO_LABEL;

function toCount(raw: unknown): number {
  const c = raw as { _count?: { entregas?: number } } | null;
  return c?._count?.entregas ?? 0;
}

export async function getTeacherActivities(materiaId: string): Promise<TeacherActivity[]> {
  if (!materiaId) return [];
  const data = await api<{ actividades: unknown[] }>(`/api/materias/${materiaId}/actividades`);
  return (data.actividades ?? []).map((raw) => {
    const a = raw as Omit<TeacherActivity, "entregasCount"> & { _count?: { entregas?: number } };
    return {
      id: a.id,
      seccion_id: a.seccion_id,
      seccion: a.seccion ?? null,
      nombre: a.nombre,
      consigna: a.consigna,
      tipo: a.tipo,
      opciones_mc: a.opciones_mc ?? null,
      formatos_permitidos: a.formatos_permitidos ?? null,
      fecha_limite: a.fecha_limite,
      correccion_manual: a.correccion_manual ?? false,
      rubrica_id: a.rubrica_id ?? null,
      rubrica: a.rubrica ?? null,
      activo: a.activo ?? true,
      entregasCount: toCount(raw),
    };
  });
}

export async function createActivity(materiaId: string, input: ActivityInput): Promise<TeacherActivity> {
  const data = await api<{ actividad: unknown }>(`/api/materias/${materiaId}/actividades`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.actividad as TeacherActivity;
}

export async function updateActivity(
  actividadId: string,
  input: Partial<ActivityInput>
): Promise<TeacherActivity> {
  const data = await api<{ actividad: unknown }>(`/api/actividades/${actividadId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return data.actividad as TeacherActivity;
}

export async function deleteActivity(actividadId: string): Promise<void> {
  await api<{ eliminada: boolean }>(`/api/actividades/${actividadId}`, { method: "DELETE" });
}
