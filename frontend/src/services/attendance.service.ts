import { api } from "./api";
import { faltasEquivalentes } from "../utils/asistencia";
import type { DailyAttendanceStatus, StudentAttendanceState } from "../types/domain";

interface AsistenciaApi {
  id: string;
  alumno_id: string;
  materia_id: string;
  fecha_clase: string;
  estado: "PRESENTE" | "AUSENTE" | "TARDANZA" | "JUSTIFICADO";
  alumno?: { id: string; nombre: string; email: string };
}

const FRONT_TO_BACK: Record<DailyAttendanceStatus, "PRESENTE" | "AUSENTE" | "TARDANZA" | "JUSTIFICADO"> = {
  present: "PRESENTE",
  absent: "AUSENTE",
  late: "TARDANZA",
  justified: "JUSTIFICADO",
};

export async function getAttendanceState(courseId: string): Promise<StudentAttendanceState[]> {
  const [inscriptosRes, data] = await Promise.all([
    api<{ alumnos: { id: string; nombre: string; email: string }[] }>(`/api/materias/${courseId}/inscriptos`),
    api<{ asistencias: AsistenciaApi[] }>(`/api/materias/${courseId}/asistencias`),
  ]);
  const registros = data.asistencias ?? [];

  const porAlumno = new Map<
    string,
    {
      id: string;
      name: string;
      ausentes: number;
      tardanzas: number;
      total: number;
      fechas: Map<string, "PRESENTE" | "AUSENTE" | "TARDANZA" | "JUSTIFICADO">;
    }
  >();

  for (const a of inscriptosRes.alumnos ?? []) {
    porAlumno.set(a.id, { id: a.id, name: a.nombre, ausentes: 0, tardanzas: 0, total: 0, fechas: new Map() });
  }

  for (const r of registros) {
    const entry = porAlumno.get(r.alumno_id) ?? {
      id: r.alumno_id,
      name: r.alumno?.nombre ?? "—",
      ausentes: 0,
      tardanzas: 0,
      total: 0,
      fechas: new Map(),
    };
    entry.total += 1;
    // Criterio: la ausencia es una falta, la tardanza media falta y el justificado no resta.
    if (r.estado === "AUSENTE") entry.ausentes += 1;
    if (r.estado === "TARDANZA") entry.tardanzas += 1;
    entry.fechas.set(r.fecha_clase, r.estado);
    porAlumno.set(r.alumno_id, entry);
  }

  const fechasOrdenadas = [...new Set(registros.map((r) => r.fecha_clase))].sort();

  const hoy = new Date().toISOString().slice(0, 10);

  const filas: StudentAttendanceState[] = [];
  for (const [, e] of porAlumno) {
    const statusHoy = e.fechas.get(hoy);
    const status: DailyAttendanceStatus =
      statusHoy === "AUSENTE"
        ? "absent"
        : statusHoy === "TARDANZA"
          ? "late"
          : statusHoy === "JUSTIFICADO"
            ? "justified"
            : "present";
    const history = fechasOrdenadas.map((f) => {
      const est = e.fechas.get(f);
      return est === "PRESENTE" || est === "TARDANZA" || est === "JUSTIFICADO";
    });
    filas.push({
      id: e.id,
      name: e.name,
      status,
      history,
      total: e.total,
      absent: faltasEquivalentes(e.ausentes, e.tardanzas),
    });
  }

  return filas.sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveAttendance(
  courseId: string,
  fechaClase: string,
  registros: { alumno_id: string; estado: DailyAttendanceStatus }[]
): Promise<{ success: boolean }> {
  await api(`/api/materias/${courseId}/asistencias`, {
    method: "POST",
    body: JSON.stringify({
      fecha_clase: fechaClase,
      registros: registros.map((r) => ({ alumno_id: r.alumno_id, estado: FRONT_TO_BACK[r.estado] })),
    }),
  });
  return { success: true };
}

// GET /api/materias/:id/asistencias/export — CSV (abre en Excel): un alumno por fila y una columna por clase.
export async function exportAttendance(courseId: string): Promise<{ filename: string; csv: string }> {
  return api<{ filename: string; csv: string }>(`/api/materias/${courseId}/asistencias/export`);
}
