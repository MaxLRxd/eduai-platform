import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deletePlanningMaterial,
  getPlanning,
  savePlanning,
  uploadPlanningMaterial,
} from "../services/planning.service";

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

export function useUploadPlanningMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadPlanningMaterial,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planning"] }),
  });
}

export function useDeletePlanningMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePlanningMaterial,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planning"] }),
  });
}
