import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAssignments,
  submitAssignment,
  uploadAssignmentFile,
  type EntregaPayload,
} from "../services/assignments.service";

export function useAssignments() {
  return useQuery({ queryKey: ["assignments"], queryFn: getAssignments });
}

export function useSubmitAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actividadId, payload }: { actividadId: string; payload: EntregaPayload }) =>
      submitAssignment(actividadId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useUploadAssignmentFile() {
  return useMutation({
    mutationFn: ({ actividadId, file }: { actividadId: string; file: File }) =>
      uploadAssignmentFile(actividadId, file),
  });
}
