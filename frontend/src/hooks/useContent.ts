import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSection,
  deleteSection,
  getCourseSections,
  getUploadedMaterials,
  uploadMaterial,
  uploadMaterialFile,
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

export function useCreateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, input }: { courseId: string; input: Parameters<typeof createSection>[1] }) =>
      createSection(courseId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["content", "sections"] }),
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content", "sections"] });
      queryClient.invalidateQueries({ queryKey: ["content", "materials"] });
    },
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

export function useUploadMaterialFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadMaterialFile,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["content", "materials"] }),
  });
}