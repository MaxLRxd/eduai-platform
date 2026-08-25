import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminSubjects, saveAdminSubject } from "../services/adminSubjects.service";

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
