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
  periodos: string[];
  periodo: string | null;
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

export interface ProgressData {
  summary: CourseGradeSummary[];
  grades: GradeDetail[];
  attendance: AttendanceRecord[];
  overview: ProgressOverview;
  periodos: string[];
  periodo: string | null;
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

export async function getProgressData(periodo?: string): Promise<ProgressData> {
  const query = periodo ? `?periodo=${encodeURIComponent(periodo)}` : "";
  const data = await api<ProgresoApi>(`/api/analytics/progreso${query}`);

  return {
    periodos: data.periodos ?? [],
    periodo: data.periodo ?? null,
    summary: data.resumen.map((r) => ({
      course: r.materia,
      average: r.promedio ?? 0,
      attendance: r.asistencia,
      color: r.promedio !== null ? gradeColor(r.promedio) : "#94a3b8",
    })),
    grades: data.detalle.map((g) => ({
      evaluation: g.evaluacion,
      course: g.materia,
      type: g.periodo,
      date: g.fecha,
      grade: g.nota,
    })),
    attendance: data.asistencia.map((a) => ({
      date: a.fecha,
      course: a.materia,
      status: ESTADO_LABEL[a.estado],
    })),
    overview: {
      promedioGeneral: data.promedio_general,
      mejorNota: data.mejor_nota,
      asistenciaGlobal: data.asistencia_global,
      actividades: data.actividades,
    },
  };
}
