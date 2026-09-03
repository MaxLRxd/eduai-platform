import { api } from "./api";
import type { DailyAttendanceStatus, StudentAttendanceState } from "../types/domain";

interface AsistenciaApi {
  id: string;
  alumno_id: string;
  materia_id: string;
  fecha_clase: string;
  estado: "PRESENTE" | "AUSENTE" | "TARDANZA" | "JUSTIFICADO";
  alumno?: { id: string; nombre: string; email: string };
}

const FRONT_TO_BACK: Record<DailyAttendanceStatus, "PRESENTE" | "AUSENTE" | "TARDANZA"> = {
  present: "PRESENTE",
  absent: "AUSENTE",
  late: "TARDANZA",
};

export async function getAttendanceState(courseId: string): Promise<StudentAttendanceState[]> {
  const data = await api<{ asistencias: AsistenciaApi[] }>(`/api/materias/${courseId}/asistencias`);
  const registros = data.asistencias ?? [];

  const porAlumno = new Map<
    string,
    {
      id: string;
      name: string;
      presentCount: number;
      total: number;
      fechas: Map<string, "PRESENTE" | "AUSENTE" | "TARDANZA" | "JUSTIFICADO">;
    }
  >();

  for (const r of registros) {
    const entry = porAlumno.get(r.alumno_id) ?? {
      id: r.alumno_id,
      name: r.alumno?.nombre ?? "—",
      presentCount: 0,
      total: 0,
      fechas: new Map(),
    };
    entry.total += 1;
    if (r.estado === "PRESENTE" || r.estado === "TARDANZA") {
      entry.presentCount += 1;
    }
    entry.fechas.set(r.fecha_clase, r.estado);
    porAlumno.set(r.alumno_id, entry);
  }

  const fechasOrdenadas = [...new Set(registros.map((r) => r.fecha_clase))].sort();

  const hoy = new Date().toISOString().slice(0, 10);

  const filas: StudentAttendanceState[] = [];
  for (const [, e] of porAlumno) {
    const statusHoy = e.fechas.get(hoy);
    const status: DailyAttendanceStatus =
      statusHoy === "AUSENTE" ? "absent" : statusHoy === "TARDANZA" || statusHoy === "JUSTIFICADO" ? "late" : "present";
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
      absent: e.total - e.presentCount,
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