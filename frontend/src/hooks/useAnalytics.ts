import { useQuery } from "@tanstack/react-query";
import {
  getFrequentErrors,
  getFrequentQuestions,
  getRiskAlerts,
  getTopicDetail,
  getTopicUnderstanding,
} from "../services/analytics.service";
import type { AnalyticsFilters } from "../types/domain";

export function useAnalytics(courseId: string | null, filtros: AnalyticsFilters = {}) {
  const enabled = Boolean(courseId);
  const clave = [filtros.periodo ?? "todos", filtros.seccionId ?? "todas"];
  const topics = useQuery({
    queryKey: ["analytics", courseId, "topics", ...clave],
    queryFn: () => getTopicUnderstanding(courseId as string, filtros),
    enabled,
  });
  // Las alertas de riesgo son del estado actual del alumno: no dependen del periodo ni de la unidad.
  const risks = useQuery({
    queryKey: ["analytics", courseId, "risks"],
    queryFn: () => getRiskAlerts(courseId as string),
    enabled,
  });
  const errors = useQuery({
    queryKey: ["analytics", courseId, "errors", ...clave],
    queryFn: () => getFrequentErrors(courseId as string, filtros),
    enabled,
  });
  const questions = useQuery({
    queryKey: ["analytics", courseId, "questions", ...clave],
    queryFn: () => getFrequentQuestions(courseId as string, filtros),
    enabled,
  });

  return { topics, risks, errors, questions };
}

/** Preguntas y errores concretos de un tema (unidad o "general") para el periodo elegido. */
export function useTopicDetail(courseId: string | null, seccionId: string | null, periodo?: string) {
  return useQuery({
    queryKey: ["analytics", courseId, "topic-detail", seccionId, periodo ?? "todos"],
    queryFn: () => getTopicDetail(courseId as string, seccionId as string, periodo),
    enabled: Boolean(courseId) && seccionId !== null,
  });
}
