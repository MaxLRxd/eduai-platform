import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateAdminKey, getAdminKeys } from "../services/adminKeys.service";

export function useAdminKeys() {
  return useQuery({ queryKey: ["admin", "keys"], queryFn: getAdminKeys });
}

export function useGenerateAdminKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateAdminKey,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "keys"] }),
  });
}
