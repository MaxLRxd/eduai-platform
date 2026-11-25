import { useQuery } from "@tanstack/react-query";
import { getLicencia } from "../services/adminLicensing.service";

export function useAdminLicensing() {
  return useQuery({ queryKey: ["admin", "license"], queryFn: getLicencia });
}
