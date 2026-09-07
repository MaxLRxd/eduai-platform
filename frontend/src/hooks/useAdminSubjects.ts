import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignAdminProfessor, getAdminSubjects, saveAdminSubject } from "../services/adminSubjects.service";

export function useAdminSubjects() {
  return useQuery({ queryKey: ["admin", "subjects"], queryFn: getAdminSubjects });
}

export function useSaveAdminSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveAdminSubject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] }),
  });
}

export function useAssignAdminProfessor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ materiaId, profesorId }: { materiaId: string; profesorId: string }) =>
      assignAdminProfessor(materiaId, profesorId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] }),
  });
}