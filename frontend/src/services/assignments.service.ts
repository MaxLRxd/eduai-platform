import { api } from "./api";
import type {
  Assignment,
  AssignmentOption,
  AssignmentStatus,
  AssignmentType,
  SubmittedAssignment,
} from "../types/domain";

interface EntregaApi {
  id: string;
  respuesta_texto: string | null;
  respuesta_codigo: string | null;
  archivo_url: string | null;
  archivo_nombre: string | null;
  entregado_en: string;
  publicado: boolean;
  calificacion_final: number | null;
  feedback_final: string | null;
}

interface ActividadApi {
  id: string;
  nombre: string;
  consigna: string;
  tipo: AssignmentType;
  opciones_mc: AssignmentOption[] | null;
  formatos_permitidos: string | null;
  fecha_limite: string;
  seccion: { id: string; nombre: string; tipo: string } | null;
  rubrica: { id: string; nombre: string } | null;
  estado_entrega: "PENDIENTE" | "ENVIADA" | "PUBLICADA";
  mi_entrega: EntregaApi | null;
}

export interface EntregaPayload {
  respuesta_texto?: string;
  respuesta_codigo?: string;
  archivo_url?: string;
  archivo_nombre?: string;
}

export interface ArchivoSubido {
  archivo_url: string;
  archivo_nombre: string;
  formato: string;
  tamano_kb: number;
}

function formatDue(iso: string): string {
  const f = new Date(iso);
  if (Number.isNaN(f.getTime())) return iso;
  return f.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toStatus(estado: string): AssignmentStatus {
  if (estado === "PUBLICADA") return "Entregado";
  if (estado === "ENVIADA") return "En revisión";
  return "Pendiente";
}

function toSubmitted(e: EntregaApi | null): SubmittedAssignment | null {
  if (!e) return null;
  return {
    respuesta_texto: e.respuesta_texto,
    respuesta_codigo: e.respuesta_codigo,
    archivo_url: e.archivo_url,
    archivo_nombre: e.archivo_nombre,
    entregado_en: e.entregado_en,
    calificacion_final: e.calificacion_final,
    feedback_final: e.feedback_final,
    publicado: e.publicado,
  };
}

function toFormatos(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((f) => f.trim().replace(/^\./, "").toLowerCase())
    .filter(Boolean);
}

export async function getAssignments(): Promise<Assignment[]> {
  const materias = await api<{ materias: { id: string; nombre: string }[] }>("/api/materias/mias");

  const resultados = await Promise.all(
    (materias.materias ?? []).map((m) =>
      api<{ actividades: ActividadApi[] }>(`/api/materias/${m.id}/actividades`)
        .then((d) => d.actividades ?? [])
        .catch(() => [] as ActividadApi[])
    )
  );

  const filas: Assignment[] = [];
  (materias.materias ?? []).forEach((m, i) => {
    for (const actividad of resultados[i]) {
      filas.push({
        id: actividad.id,
        title: actividad.nombre,
        course: m.nombre,
        consigna: actividad.consigna,
        tipo: actividad.tipo,
        opciones: actividad.opciones_mc ?? [],
        formatosPermitidos: toFormatos(actividad.formatos_permitidos),
        dueDate: formatDue(actividad.fecha_limite),
        dueDateIso: actividad.fecha_limite,
        status: toStatus(actividad.estado_entrega ?? "PENDIENTE"),
        submitted: toSubmitted(actividad.mi_entrega),
      });
    }
  });

  return filas;
}

export async function submitAssignment(actividadId: string, payload: EntregaPayload): Promise<void> {
  await api<{ entrega: unknown }>(`/api/actividades/${actividadId}/entrega`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadAssignmentFile(actividadId: string, file: File): Promise<ArchivoSubido> {
  const form = new FormData();
  form.append("archivo", file);
  const data = await api<{ archivo: ArchivoSubido }>(`/api/actividades/${actividadId}/entrega/archivo`, {
    method: "POST",
    body: form,
  });
  return data.archivo;
}
