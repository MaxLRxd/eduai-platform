import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPlanning, savePlanning } from "../services/planning.service";

export function usePlanning(courseId: string | null, courseName: string) {
  return useQuery({
    queryKey: ["planning", courseId],
    queryFn: () => getPlanning(courseId as string, courseName),
    enabled: Boolean(courseId),
  });
}

export function useSavePlanning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savePlanning,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planning"] }),
  });
}