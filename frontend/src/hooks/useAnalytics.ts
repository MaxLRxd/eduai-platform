import { useQuery } from "@tanstack/react-query";
import { getFrequentErrors, getFrequentQuestions, getRiskAlerts, getTopicUnderstanding } from "../services/analytics.service";

export function useAnalytics() {
  const topics = useQuery({ queryKey: ["analytics", "topics"], queryFn: getTopicUnderstanding });
  const risks = useQuery({ queryKey: ["analytics", "risks"], queryFn: getRiskAlerts });
  const errors = useQuery({ queryKey: ["analytics", "errors"], queryFn: getFrequentErrors });
  const questions = useQuery({ queryKey: ["analytics", "questions"], queryFn: getFrequentQuestions });

  return { topics, risks, errors, questions };
}
