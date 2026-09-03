import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCourseSections,
  getUploadedMaterials,
  uploadMaterial,
} from "../services/content.service";

export function useCourseSections(courseId: string | null) {
  return useQuery({
    queryKey: ["content", "sections", courseId],
    queryFn: () => getCourseSections(courseId as string),
    enabled: !!courseId,
  });
}

export function useUploadedMaterials(sectionId: string | null) {
  return useQuery({
    queryKey: ["content", "materials", sectionId],
    queryFn: () => getUploadedMaterials(sectionId as string),
    enabled: !!sectionId,
  });
}

export function useUploadMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadMaterial,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["content", "materials"] }),
  });
}