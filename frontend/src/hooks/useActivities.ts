import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createActivity,
  deleteActivity,
  getTeacherActivities,
  updateActivity,
  type ActivityInput,
} from "../services/activities.service";

const key = (materiaId: string) => ["teacher-activities", materiaId];

export function useTeacherActivities(materiaId: string | null) {
  return useQuery({
    queryKey: key(materiaId ?? ""),
    queryFn: () => getTeacherActivities(materiaId as string),
    enabled: Boolean(materiaId),
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ materiaId, input }: { materiaId: string; input: ActivityInput }) =>
      createActivity(materiaId, input),
    onSuccess: (_data, vars) => queryClient.invalidateQueries({ queryKey: key(vars.materiaId) }),
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actividadId, input }: { actividadId: string; input: Partial<ActivityInput> }) =>
      updateActivity(actividadId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher-activities"] }),
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actividadId }: { actividadId: string }) => deleteActivity(actividadId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher-activities"] }),
  });
}
