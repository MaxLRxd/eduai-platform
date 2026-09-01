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

export async function getTeacherCourseStudents(courseId: string): Promise<TeacherStudentRow[]> {
  const { notas, asistencias } = await getDatosMateria(courseId);

  const porAlumno = new Map<
    string,
    { name: string; email: string; califs: number[]; total: number; presentes: number }
  >();

  for (const n of notas) {
    const entry = porAlumno.get(n.alumno_id) ?? { name: "", email: "", califs: [], total: 0, presentes: 0 };
    entry.name = n.alumno?.nombre ?? "—";
    entry.email = n.alumno?.email ?? "—";
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
  for (const [, e] of porAlumno) {
    const promedio = e.califs.length ? e.califs.reduce((s, c) => s + c, 0) / e.califs.length : 0;
    const attendance = e.total ? Math.round((e.presentes / e.total) * 100) : 0;
    const standing: StudentStanding = promedio >= 7 ? "Regular" : "En riesgo";
    filas.push({
      name: e.name,
      legajo: e.email,
      average: fmtNum(promedio),
      attendance: `${attendance}%`,
      standing,
    });
  }

  return filas.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTeacherCourseGrades(courseId: string): Promise<TeacherGradeRow[]> {
  const { notas } = await getDatosMateria(courseId);

  const porAlumno = new Map<string, { name: string; porPeriodo: Map<string, number> }>();
  for (const n of notas) {
    const entry = porAlumno.get(n.alumno_id) ?? { name: n.alumno?.nombre ?? "—", porPeriodo: new Map() };
    entry.porPeriodo.set(n.periodo, n.calificacion);
    porAlumno.set(n.alumno_id, entry);
  }

  const filas: TeacherGradeRow[] = [];
  for (const [, e] of porAlumno) {
    const v1 = e.porPeriodo.get("2026-1");
    const v2 = e.porPeriodo.get("2026-2");
    const califs = [...e.porPeriodo.values()];
    const avg = califs.length ? califs.reduce((s, c) => s + c, 0) / califs.length : 0;
    filas.push({ name: e.name, tp1: fmtNum(v1), tp2: fmtNum(v2), tp3: "—", parcial: "—", average: fmtNum(avg) });
  }

  return filas.sort((a, b) => a.name.localeCompare(b.name));
}