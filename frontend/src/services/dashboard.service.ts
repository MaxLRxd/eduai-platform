import { api } from "./api";

export interface DashboardResumenComun {
  materias: number;
  entregasPendientes: number;
  alertasActivas: number;
}

export interface DashboardNota {
  id: string;
  evaluacion: string;
  categoria: string | null;
  calificacion: number;
  fecha: string;
}

export interface DashboardAlumnoMateria {
  id: string;
  nombre: string;
  promedio: number | null;
  progreso: number;
  /** Las notas mas recientes de la materia (como mucho 5), ya filtradas por el periodo elegido. */
  notas: DashboardNota[];
  total_notas: number;
}

export interface DashboardAlumno {
  rol: "ALUMNO";
  periodos: string[];
  periodo: string | null;
  resumen: DashboardResumenComun & {
    promedioGlobal: number;
    promedioPeriodoActual: number | null;
  };
  materias: DashboardAlumnoMateria[];
  asistencia: { estado: string; count: number }[];
  proximasActividades: { id: string; nombre: string; materia: string; fecha_limite: string }[];
}

export interface DashboardProfesor {
  rol: "PROFESOR";
  resumen: DashboardResumenComun & {
    actividades: number;
    alumnos: number;
  };
  materias: {
    id: string;
    nombre: string;
    nivel_educativo: string;
    inscriptos: number;
    secciones: number;
    actividades: number;
  }[];
}

export interface DashboardAdmin {
  rol: "ADMIN";
  resumen: DashboardResumenComun & {
    inscripciones: number;
    usuarios: { rol: "ALUMNO" | "PROFESOR" | "ADMIN"; count: number }[];
  };
}

export function getDashboardAlumno(periodo?: string): Promise<DashboardAlumno> {
  const query = periodo ? `?periodo=${encodeURIComponent(periodo)}` : "";
  return api<DashboardAlumno>(`/api/dashboard/alumno${query}`);
}

export function getDashboardProfesor(): Promise<DashboardProfesor> {
  return api<DashboardProfesor>("/api/dashboard/profesor");
}

export function getDashboardAdmin(): Promise<DashboardAdmin> {
  return api<DashboardAdmin>("/api/dashboard");
}