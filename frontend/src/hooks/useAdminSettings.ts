import { useMutation, useQuery } from "@tanstack/react-query";
import { getColorPresets, getInstitutionName, saveBranding } from "../services/adminSettings.service";

export function useAdminSettings() {
  const presets = useQuery({ queryKey: ["admin", "settings", "presets"], queryFn: getColorPresets });
  const institutionName = useQuery({ queryKey: ["admin", "settings", "name"], queryFn: getInstitutionName });
  return { presets, institutionName };
}

export function useSaveBranding() {
  return useMutation({ mutationFn: saveBranding });
}
