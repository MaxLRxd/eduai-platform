import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignPlanningMaterial,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning"] });
      queryClient.invalidateQueries({ queryKey: ["content"] });
    },
  });
}

export function useUploadPlanningMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadPlanningMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning"] });
      queryClient.invalidateQueries({ queryKey: ["content"] });
    },
  });
}

export function useAssignPlanningMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignPlanningMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning"] });
      queryClient.invalidateQueries({ queryKey: ["content"] });
    },
  });
}

export function useDeletePlanningMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePlanningMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning"] });
      queryClient.invalidateQueries({ queryKey: ["content"] });
    },
  });
}

