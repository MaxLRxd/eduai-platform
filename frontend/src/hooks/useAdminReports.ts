import { useMutation, useQuery } from "@tanstack/react-query";
import { exportReport, exportReportPdf, getAdminReports } from "../services/adminReports.service";

export function useAdminReports() {
  return useQuery({ queryKey: ["admin", "reports"], queryFn: getAdminReports });
}

export function useExportReport() {
  return useMutation({ mutationFn: exportReport });
}

export function useExportReportPdf() {
  return useMutation({ mutationFn: exportReportPdf });
}