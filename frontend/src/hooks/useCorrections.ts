import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCorrectionQueue, getRubrics, publishCorrection } from "../services/corrections.service";

export function useCorrectionQueue() {
  return useQuery({ queryKey: ["corrections", "queue"], queryFn: getCorrectionQueue });
}

export function useRubrics(materiaId?: string) {
  return useQuery({
    queryKey: ["corrections", "rubrics", materiaId ?? "none"],
    queryFn: () => getRubrics(materiaId ?? ""),
    enabled: Boolean(materiaId),
  });
}

export function usePublishCorrection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: publishCorrection,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["corrections", "queue"] });
    },
  });
}