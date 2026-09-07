import type {
  AttendanceRecord,
  AttendanceStatus,
  CourseGradeSummary,
  GradeDetail,
} from "../types/domain";
import { api } from "./api";

interface ResumenProgresoApi {
  materia_id: string;
  materia: string;
  promedio: number | null;
  asistencia: number;
}

interface ProgresoApi {
  resumen: ResumenProgresoApi[];
  promedio_general: number;
  mejor_nota: number;
  actividades: { entregadas: number; total: number };
  asistencia_global: number;
  detalle: {
    evaluacion: string;
    materia: string;
    periodo: string;
    fecha: string;
    nota: number;
  }[];
  asistencia: {
    fecha: string;
    materia: string;
    estado: "PRESENTE" | "AUSENTE" | "TARDANZA" | "JUSTIFICADO";
  }[];
}

export interface ProgressOverview {
  promedioGeneral: number;
  mejorNota: number;
  asistenciaGlobal: number;
  actividades: { entregadas: number; total: number };
}

const ESTADO_LABEL: Record<
  "PRESENTE" | "AUSENTE" | "TARDANZA" | "JUSTIFICADO",
  AttendanceStatus
> = {
  PRESENTE: "Presente",
  AUSENTE: "Ausente",
  TARDANZA: "Tardanza",
  JUSTIFICADO: "Justificado",
};

function gradeColor(value: number): string {
  if (value >= 8) return "#059669";
  if (value >= 6) return "#d97706";
  return "#dc2626";
}

let cache: Promise<ProgresoApi> | null = null;

async function getProgreso(): Promise<ProgresoApi> {
  if (!cache) {
    cache = api<ProgresoApi>("/api/analytics/progreso").catch((error) => {
      cache = null;
      throw error;
    });
  }
  return cache;
}

export async function getCourseGradeSummary(): Promise<CourseGradeSummary[]> {
  const data = await getProgreso();
  return data.resumen.map((r) => ({
    course: r.materia,
    average: r.promedio ?? 0,
    attendance: r.asistencia,
    color: r.promedio !== null ? gradeColor(r.promedio) : "#94a3b8",
  }));
}

export async function getGradeDetail(): Promise<GradeDetail[]> {
  const data = await getProgreso();
  return data.detalle.map((g) => ({
    evaluation: g.evaluacion,
    course: g.materia,
    type: g.periodo,
    date: g.fecha,
    grade: g.nota,
  }));
}

export async function getAttendanceLog(): Promise<AttendanceRecord[]> {
  const data = await getProgreso();
  return data.asistencia.map((a) => ({
    date: a.fecha,
    course: a.materia,
    status: ESTADO_LABEL[a.estado],
  }));
}

export async function getProgressOverview(): Promise<ProgressOverview> {
  const data = await getProgreso();
  return {
    promedioGeneral: data.promedio_general,
    mejorNota: data.mejor_nota,
    asistenciaGlobal: data.asistencia_global,
    actividades: data.actividades,
  };
}