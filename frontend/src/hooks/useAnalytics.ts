import { useQuery } from "@tanstack/react-query";
import { getFrequentErrors, getFrequentQuestions, getRiskAlerts, getTopicUnderstanding } from "../services/analytics.service";

export function useAnalytics(courseId: string | null) {
  const enabled = Boolean(courseId);
  const topics = useQuery({
    queryKey: ["analytics", courseId, "topics"],
    queryFn: () => getTopicUnderstanding(courseId as string),
    enabled,
  });
  const risks = useQuery({
    queryKey: ["analytics", courseId, "risks"],
    queryFn: () => getRiskAlerts(courseId as string),
    enabled,
  });
  const errors = useQuery({
    queryKey: ["analytics", courseId, "errors"],
    queryFn: () => getFrequentErrors(courseId as string),
    enabled,
  });
  const questions = useQuery({
    queryKey: ["analytics", courseId, "questions"],
    queryFn: () => getFrequentQuestions(courseId as string),
    enabled,
  });

  return { topics, risks, errors, questions };
}