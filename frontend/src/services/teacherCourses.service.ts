import { api } from "./api";
import type { StudentStanding, TeacherCourse, TeacherGradeRow, TeacherStudentRow } from "../types/domain";

interface NotaApi {
  id: string;
  alumno_id: string;
  periodo: string;
  calificacion: number;
  alumno?: { id: string; nombre: string; email: string };
}

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

async function getDatosMateria(courseId: string): Promise<{ notas: NotaApi[]; asistencias: AsistenciaApi[] }> {
  const [notasRes, asistRes] = await Promise.all([
    api<{ notas: NotaApi[] }>(`/api/materias/${courseId}/notas`),
    api<{ asistencias: AsistenciaApi[] }>(`/api/materias/${courseId}/asistencias`),
  ]);
  return { notas: notasRes.notas ?? [], asistencias: asistRes.asistencias ?? [] };
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
  const [inscriptos, { notas, asistencias }] = await Promise.all([
    getCourseEnrolledStudents(courseId),
    getDatosMateria(courseId),
  ]);

  const porAlumno = new Map<
    string,
    { name: string; email: string; califs: number[]; total: number; presentes: number }
  >();

  for (const a of inscriptos) {
    porAlumno.set(a.id, { name: a.nombre, email: a.email, califs: [], total: 0, presentes: 0 });
  }

  for (const n of notas) {
    const entry =
      porAlumno.get(n.alumno_id) ??
      { name: n.alumno?.nombre ?? "—", email: n.alumno?.email ?? "—", califs: [], total: 0, presentes: 0 };
    if (!entry.name) entry.name = n.alumno?.nombre ?? "—";
    if (!entry.email) entry.email = n.alumno?.email ?? "—";
    entry.califs.push(n.calificacion);
    porAlumno.set(n.alumno_id, entry);
  }

  for (const a of asistencias) {
    const entry = porAlumno.get(a.alumno_id);
    if (entry) {
      entry.total += 1;
      if (a.estado === "PRESENTE" || a.estado === "TARDANZA") {
        entry.presentes += 1;
      }
    }
  }

  const filas: TeacherStudentRow[] = [];
  for (const [id, e] of porAlumno) {
    const promedio = e.califs.length ? e.califs.reduce((s, c) => s + c, 0) / e.califs.length : 0;
    const attendance = e.total ? Math.round((e.presentes / e.total) * 100) : 0;
    const standing: StudentStanding = promedio >= 7 ? "Regular" : "En riesgo";
    filas.push({
      id,
      name: e.name,
      legajo: e.email,
      average: e.califs.length ? fmtNum(promedio) : "—",
      attendance: e.total ? `${attendance}%` : "—",
      standing,
    });
  }

  return filas.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTeacherCourseGrades(
  courseId: string
): Promise<{ rows: TeacherGradeRow[]; periods: string[] }> {
  const [inscriptos, { notas }] = await Promise.all([
    getCourseEnrolledStudents(courseId),
    getDatosMateria(courseId),
  ]);

  const porAlumno = new Map<string, { name: string; porPeriodo: Map<string, number> }>();
  for (const a of inscriptos) {
    porAlumno.set(a.id, { name: a.nombre, porPeriodo: new Map() });
  }

  for (const n of notas) {
    const entry =
      porAlumno.get(n.alumno_id) ??
      { name: n.alumno?.nombre ?? "—", porPeriodo: new Map<string, number>() };
    entry.porPeriodo.set(n.periodo, n.calificacion);
    porAlumno.set(n.alumno_id, entry);
  }

  const periods = [...new Set(notas.map((n) => n.periodo))].sort();
  const filas: TeacherGradeRow[] = [];
  for (const [studentId, e] of porAlumno) {
    const califs = [...e.porPeriodo.values()];
    const avg = califs.length ? califs.reduce((s, c) => s + c, 0) / califs.length : 0;
    const grades: Record<string, string> = {};
    for (const p of periods) {
      grades[p] = fmtNum(e.porPeriodo.get(p));
    }
    filas.push({
      studentId,
      name: e.name,
      grades,
      average: califs.length ? fmtNum(avg) : "—",
    });
  }

  return { rows: filas.sort((a, b) => a.name.localeCompare(b.name)), periods };
}

export async function crearNota(
  courseId: string,
  input: {
    alumno_id: string;
    periodo: string;
    calificacion: number;
    observaciones?: string;
  }
): Promise<void> {
  await api(`/api/materias/${courseId}/notas`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}