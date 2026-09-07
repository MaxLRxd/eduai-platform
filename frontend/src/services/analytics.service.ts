import { api } from "./api";
import type { FrequentError, FrequentQuestion, RiskAlert, TopicUnderstanding } from "../types/domain";

interface SeccionLight {
  id: string;
  nombre: string;
}

interface ComprensionApi {
  seccion_id: string | null;
  nivel_comprension: number;
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
  seccion_id: string | null;
  tipo: "ERROR" | "DUDA";
  descripcion: string;
  frecuencia: number;
}

function nivelComprension(v: number): TopicUnderstanding["level"] {
  const norm = v > 1 ? v / 100 : v;
  if (norm >= 0.8) return "Dominado";
  if (norm >= 0.6) return "En proceso";
  return "Crítico";
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
// Los registros vienen por alumno+sección; se agregan por sección (promedio).
export async function getTopicUnderstanding(courseId: string): Promise<TopicUnderstanding[]> {
  const [data, names] = await Promise.all([
    api<{ comprension: ComprensionApi[] }>(`/api/materias/${courseId}/analytics/comprension`),
    seccionNameMap(courseId),
  ]);

  const grouped = new Map<string, { seccion: string; sum: number; count: number }>();
  for (const c of data.comprension ?? []) {
    const key = c.seccion_id ?? "general";
    const entry = grouped.get(key) ?? {
      seccion: (c.seccion_id && names.get(c.seccion_id)) || "Materia",
      sum: 0,
      count: 0,
    };
    entry.sum += c.nivel_comprension;
    entry.count += 1;
    grouped.set(key, entry);
  }

  return [...grouped.values()].map((g) => ({
    topic: g.seccion,
    level: nivelComprension(g.sum / g.count),
  }));
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
export async function getFrequentErrors(courseId: string): Promise<FrequentError[]> {
  const [data, names] = await Promise.all([
    api<{ dudas: DudaApi[] }>(`/api/materias/${courseId}/analytics/dudas`),
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
export async function getFrequentQuestions(courseId: string): Promise<FrequentQuestion[]> {
  const data = await api<{ dudas: DudaApi[] }>(`/api/materias/${courseId}/analytics/dudas`);
  return (data.dudas ?? [])
    .filter((d) => d.tipo === "DUDA")
    .sort((a, b) => b.frecuencia - a.frecuencia)
    .map((d) => ({ question: d.descripcion, count: d.frecuencia }));
}