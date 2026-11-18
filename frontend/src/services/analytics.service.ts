import { api } from "./api";
import type {
  AnalyticsFilters,
  FrequentError,
  FrequentQuestion,
  RiskAlert,
  TopicDetailItem,
  TopicUnderstanding,
} from "../types/domain";

interface SeccionLight {
  id: string;
  nombre: string;
}

interface ComprensionApi {
  seccion_id: string | null;
  nivel_comprension: number | null;
  total_consultas: number;
  total_errores: number;
}

interface AlertaApi {
  alumno: { id: string; nombre: string; email: string };
  descripcion: string;
  nivel_severidad: string;
  activa: boolean;
}

interface DudaApi {
  id: string;
  seccion_id: string | null;
  tipo: "ERROR" | "DUDA";
  descripcion: string;
  frecuencia: number;
}

export function nivelComprension(v: number | null): TopicUnderstanding["level"] {
  if (v === null) return "Sin evaluar";
  const norm = v > 1 ? v / 100 : v;
  if (norm >= 0.8) return "Dominado";
  if (norm >= 0.6) return "En proceso";
  return "Crítico";
}

/** Arma ?periodo=&seccion_id= solo con los filtros que tienen valor. */
export function filtrosQuery(filtros: AnalyticsFilters = {}): string {
  const params = new URLSearchParams();
  if (filtros.periodo) params.set("periodo", filtros.periodo);
  if (filtros.seccionId) params.set("seccion_id", filtros.seccionId);
  const q = params.toString();
  return q ? `?${q}` : "";
}

async function seccionNameMap(courseId: string): Promise<Map<string, string>> {
  try {
    const data = await api<{ secciones: SeccionLight[] }>(`/api/materias/${courseId}/secciones`);
    return new Map((data.secciones ?? []).map((s) => [s.id, s.nombre]));
  } catch {
    return new Map();
  }
}

// GET /api/materias/:materiaId/analytics/comprension
// Los registros vienen por unidad y periodo; se agregan por unidad (suma de consultas y errores,
// promedio de los niveles medidos). Sin ningun nivel medido el tema queda "Sin evaluar".
export async function getTopicUnderstanding(
  courseId: string,
  filtros: AnalyticsFilters = {}
): Promise<{ topics: TopicUnderstanding[]; periodos: string[] }> {
  const [data, names] = await Promise.all([
    api<{ comprension: ComprensionApi[]; periodos?: string[] }>(
      `/api/materias/${courseId}/analytics/comprension${filtrosQuery(filtros)}`
    ),
    seccionNameMap(courseId),
  ]);

  const grouped = new Map<
    string,
    { id: string | null; seccion: string; sum: number; medidos: number; consultas: number; errores: number }
  >();
  for (const c of data.comprension ?? []) {
    const key = c.seccion_id ?? "general";
    const entry = grouped.get(key) ?? {
      id: c.seccion_id,
      seccion: (c.seccion_id && names.get(c.seccion_id)) || "General (sin unidad)",
      sum: 0,
      medidos: 0,
      consultas: 0,
      errores: 0,
    };
    if (c.nivel_comprension !== null) {
      entry.sum += c.nivel_comprension;
      entry.medidos += 1;
    }
    entry.consultas += c.total_consultas;
    entry.errores += c.total_errores;
    grouped.set(key, entry);
  }

  return {
    periodos: data.periodos ?? [],
    topics: [...grouped.values()].map((g) => ({
      id: g.id,
      topic: g.seccion,
      level: nivelComprension(g.medidos > 0 ? g.sum / g.medidos : null),
      consultas: g.consultas,
      errores: g.errores,
    })),
  };
}

// Detalle de un tema: las preguntas y errores concretos de esa unidad (o "general").
export async function getTopicDetail(
  courseId: string,
  seccionId: string,
  periodo?: string
): Promise<TopicDetailItem[]> {
  const data = await api<{ dudas: DudaApi[] }>(
    `/api/materias/${courseId}/analytics/dudas${filtrosQuery({ seccionId, periodo })}`
  );
  return (data.dudas ?? [])
    .map((d) => ({ id: d.id, tipo: d.tipo, descripcion: d.descripcion, frecuencia: d.frecuencia }))
    .sort((a, b) => b.frecuencia - a.frecuencia);
}

// GET /api/materias/:materiaId/analytics/riesgo — solo alertas activas.
export async function getRiskAlerts(courseId: string): Promise<RiskAlert[]> {
  const data = await api<{ alertas: AlertaApi[] }>(`/api/materias/${courseId}/analytics/riesgo`);
  return (data.alertas ?? [])
    .filter((a) => a.activa)
    .map((a) => ({
      name: a.alumno.nombre,
      issue: a.descripcion,
      risk: a.nivel_severidad === "ALTA" ? "Alto" : a.nivel_severidad === "MEDIA" ? "Medio" : "Bajo",
    }));
}

// GET /api/materias/:materiaId/analytics/dudas — filtra errores (tipo ERROR).
export async function getFrequentErrors(courseId: string, filtros: AnalyticsFilters = {}): Promise<FrequentError[]> {
  const [data, names] = await Promise.all([
    api<{ dudas: DudaApi[] }>(`/api/materias/${courseId}/analytics/dudas${filtrosQuery(filtros)}`),
    seccionNameMap(courseId),
  ]);
  return (data.dudas ?? [])
    .filter((d) => d.tipo === "ERROR")
    .sort((a, b) => b.frecuencia - a.frecuencia)
    .map((d, i) => ({
      rank: i + 1,
      description: d.descripcion,
      studentCount: d.frecuencia,
      topics: (d.seccion_id && names.get(d.seccion_id)) || "General",
    }));
}

// GET /api/materias/:materiaId/analytics/dudas — filtra dudas (tipo DUDA).
export async function getFrequentQuestions(
  courseId: string,
  filtros: AnalyticsFilters = {}
): Promise<FrequentQuestion[]> {
  const data = await api<{ dudas: DudaApi[] }>(`/api/materias/${courseId}/analytics/dudas${filtrosQuery(filtros)}`);
  return (data.dudas ?? [])
    .filter((d) => d.tipo === "DUDA")
    .sort((a, b) => b.frecuencia - a.frecuencia)
    .map((d) => ({ question: d.descripcion, count: d.frecuencia }));
}