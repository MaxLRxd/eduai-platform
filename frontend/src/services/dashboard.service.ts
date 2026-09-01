import { api } from "./api";

export interface DashboardResumenComun {
  materias: number;
  entregasPendientes: number;
  alertasActivas: number;
}

export interface DashboardAlumno {
  rol: "ALUMNO";
  resumen: DashboardResumenComun & {
    promedioGlobal: number;
    promedioPeriodoActual: number | null;
  };
  materias: { id: string; nombre: string; promedio: number }[];
  asistencia: { estado: string; count: number }[];
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

export function getDashboardAlumno(): Promise<DashboardAlumno> {
  return api<DashboardAlumno>("/api/dashboard/alumno");
}

export function getDashboardProfesor(): Promise<DashboardProfesor> {
  return api<DashboardProfesor>("/api/dashboard/profesor");
}

export function getDashboardAdmin(): Promise<DashboardAdmin> {
  return api<DashboardAdmin>("/api/dashboard");
}