import { api } from "./api";
import { porcentajeAsistencia } from "../utils/asistencia";
import type { StudentStanding, TeacherCourse, TeacherStudentRow } from "../types/domain";
import { getResumenCalificaciones } from "./calificaciones.service";

interface AsistenciaApi {
  id: string;
  alumno_id: string;
  estado: "PRESENTE" | "AUSENTE" | "TARDANZA" | "JUSTIFICADO";
  alumno?: { id: string; nombre: string; email: string };
}

function fmtNum(n: number | undefined): string {
  return n == null ? "—" : n.toFixed(2);
}

export async function getTeacherCourses(): Promise<TeacherCourse[]> {
  const data = await api<{
    materias: { id: string; nombre: string; nivel_educativo: string; inscriptos: number }[];
  }>("/api/materias/mias");

  return (data.materias ?? []).map((m) => ({
    id: m.id,
    label: m.nombre,
    curso: m.nivel_educativo,
    studentNames: [],
    alumnos: m.inscriptos,
  }));
}

async function getAsistenciasMateria(courseId: string): Promise<AsistenciaApi[]> {
  const res = await api<{ asistencias: AsistenciaApi[] }>(`/api/materias/${courseId}/asistencias`);
  return res.asistencias ?? [];
}

export interface EnrolledStudent {
  id: string;
  nombre: string;
  email: string;
}

export async function getCourseEnrolledStudents(courseId: string): Promise<EnrolledStudent[]> {
  const data = await api<{ alumnos: EnrolledStudent[] }>(`/api/materias/${courseId}/inscriptos`);
  return data.alumnos ?? [];
}

export async function getTeacherCourseStudents(courseId: string): Promise<TeacherStudentRow[]> {
  // El promedio viene del servidor: es la nota final ponderada por categorias, la misma que ve el alumno.
  const [resumen, asistencias] = await Promise.all([
    getResumenCalificaciones(courseId),
    getAsistenciasMateria(courseId),
  ]);

  const asistenciaPorAlumno = new Map<string, { total: number; ausentes: number; tardanzas: number }>();
  for (const a of asistencias) {
    const entry = asistenciaPorAlumno.get(a.alumno_id) ?? { total: 0, ausentes: 0, tardanzas: 0 };
    entry.total += 1;
    if (a.estado === "AUSENTE") entry.ausentes += 1;
    if (a.estado === "TARDANZA") entry.tardanzas += 1;
    asistenciaPorAlumno.set(a.alumno_id, entry);
  }

  const filas: TeacherStudentRow[] = resumen.alumnos.map((al) => {
    const asist = asistenciaPorAlumno.get(al.alumno_id) ?? { total: 0, ausentes: 0, tardanzas: 0 };
    const attendance = porcentajeAsistencia(asist.total, asist.ausentes, asist.tardanzas);
    const standing: StudentStanding = (al.promedio ?? 0) >= 7 ? "Regular" : "En riesgo";
    return {
      id: al.alumno_id,
      name: al.nombre,
      legajo: al.email,
      average: fmtNum(al.promedio ?? undefined),
      averageValue: al.promedio ?? null,
      attendance: attendance === null ? "—" : `${attendance}%`,
      attendanceValue: attendance,
      standing,
    };
  });

  return filas.sort((a, b) => a.name.localeCompare(b.name));
}

export interface GradeSourceStudent {
  alumno_id: string;
  nombre: string;
  tps: {
    cantidad: number;
    promedio: number | null;
    detalle: { nombre: string; tipo: string; nota: number; publicado: boolean }[];
  };
  simulacros: {
    cantidad: number;
    promedio: number | null;
    detalle: { titulo: string; dificultad: string; puntaje: number; creado_en: string }[];
  };
}

export async function getTeacherGradeSources(courseId: string): Promise<GradeSourceStudent[]> {
  const data = await api<{ alumnos: GradeSourceStudent[] }>(
    `/api/materias/${courseId}/calificaciones/fuentes`
  );
  return data.alumnos ?? [];
}

export async function crearNota(
  courseId: string,
  input: {
    alumno_id: string;
    periodo: string;
    calificacion: number;
    observaciones?: string;
    evaluacion?: string;
    categoria_id?: string | null;
  }
): Promise<void> {
  await api(`/api/materias/${courseId}/notas`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}