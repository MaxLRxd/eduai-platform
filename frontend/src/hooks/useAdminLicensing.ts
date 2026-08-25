import { useQuery } from "@tanstack/react-query";
import { getLicensePlans, getLicenseUsage } from "../services/adminLicensing.service";

export function useAdminLicensing() {
  const usage = useQuery({ queryKey: ["admin", "license", "usage"], queryFn: getLicenseUsage });
  const plans = useQuery({ queryKey: ["admin", "license", "plans"], queryFn: getLicensePlans });
  return { usage, plans };
}
