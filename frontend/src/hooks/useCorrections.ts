import { useMutation, useQuery } from "@tanstack/react-query";
import { getCorrectionQueue, getRubricCriteria, getRubrics, publishCorrection } from "../services/corrections.service";

export function useCorrectionQueue() {
  return useQuery({ queryKey: ["corrections", "queue"], queryFn: getCorrectionQueue });
}

export function useRubricCriteria() {
  return useQuery({ queryKey: ["corrections", "rubric-criteria"], queryFn: getRubricCriteria });
}

export function useRubrics() {
  return useQuery({ queryKey: ["corrections", "rubrics"], queryFn: getRubrics });
}

export function usePublishCorrection() {
  return useMutation({ mutationFn: publishCorrection });
}
