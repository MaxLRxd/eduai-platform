import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUploadedMaterials, uploadMaterial } from "../services/content.service";

export function useUploadedMaterials() {
  return useQuery({ queryKey: ["content", "materials"], queryFn: getUploadedMaterials });
}

export function useUploadMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadMaterial,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["content", "materials"] }),
  });
}
