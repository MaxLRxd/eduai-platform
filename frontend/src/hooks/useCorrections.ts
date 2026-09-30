import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  correctWithAi,
  createRubric,
  deleteRubric,
  getCorrectionQueue,
  getRubrics,
  publishCorrection,
  updateRubric,
  type RubricInput,
} from "../services/corrections.service";

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

function useInvalidateRubrics(materiaId?: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["corrections", "rubrics"] });
    // La actividad guarda rubrica_id: si la rúbrica se borra, la pantalla de
    // actividades tiene que dejar de ofrecerla.
    qc.invalidateQueries({ queryKey: ["teacher-activities"] });
    if (materiaId) {
      qc.invalidateQueries({ queryKey: ["content", materiaId] });
    }
  };
}

export function useCreateRubric(materiaId?: string) {
  const invalidate = useInvalidateRubrics(materiaId);
  return useMutation({
    mutationFn: (input: RubricInput) => createRubric(materiaId as string, input),
    onSuccess: invalidate,
  });
}

export function useUpdateRubric(materiaId?: string) {
  const invalidate = useInvalidateRubrics(materiaId);
  return useMutation({
    mutationFn: ({ rubricId, input }: { rubricId: string; input: Partial<RubricInput> }) =>
      updateRubric(rubricId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteRubric(materiaId?: string) {
  const invalidate = useInvalidateRubrics(materiaId);
  return useMutation({
    mutationFn: (rubricId: string) => deleteRubric(rubricId),
    onSuccess: invalidate,
  });
}

export function useCorrectWithAi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: correctWithAi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["corrections", "queue"] });
    },
  });
}
