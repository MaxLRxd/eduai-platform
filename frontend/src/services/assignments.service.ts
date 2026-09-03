import { api } from "./api";
import type { Assignment, AssignmentStatus } from "../types/domain";

interface ActividadApi {
  id: string;
  nombre: string;
  tipo: "MULTIPLE_CHOICE" | "DESARROLLO" | "ARCHIVO" | "CODIGO";
  fecha_limite: string;
  seccion: { id: string; nombre: string; tipo: string } | null;
  rubrica: { id: string; nombre: string } | null;
  descripcion?: string | null;
  estado_entrega: "PENDIENTE" | "ENVIADA" | "PUBLICADA";
  mi_entrega: { calificacion_final: number | null; publicado: boolean } | null;
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
        title: actividad.nombre,
        course: m.nombre,
        dueDate: formatDue(actividad.fecha_limite),
        status: toStatus(actividad.estado_entrega ?? "PENDIENTE"),
      });
    }
  });

  return filas;
}