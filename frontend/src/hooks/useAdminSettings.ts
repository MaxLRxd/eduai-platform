import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBranding, getColorPresets, saveBranding } from "../services/adminSettings.service";

export function useAdminSettings() {
  const presets = useQuery({ queryKey: ["admin", "settings", "presets"], queryFn: getColorPresets });
  const branding = useQuery({ queryKey: ["admin", "settings", "branding"], queryFn: getBranding });
  return { presets, branding };
}

export function useSaveBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveBranding,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "settings", "branding"] }),
  });
}