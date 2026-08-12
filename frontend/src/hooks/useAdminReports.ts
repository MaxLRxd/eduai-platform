import { useMutation, useQuery } from "@tanstack/react-query";
import { exportReport, getAdminReports } from "../services/adminReports.service";

export function useAdminReports() {
  return useQuery({ queryKey: ["admin", "reports"], queryFn: getAdminReports });
}

export function useExportReport() {
  return useMutation({ mutationFn: exportReport });
}
