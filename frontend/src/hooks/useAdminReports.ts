import { useMutation, useQuery } from "@tanstack/react-query";
import {
  exportReport,
  exportReportPdf,
  getAdminReports,
  type FiltrosReporte,
} from "../services/adminReports.service";

export function useAdminReports(filtros: FiltrosReporte) {
  return useQuery({ queryKey: ["admin", "reports", filtros], queryFn: () => getAdminReports(filtros) });
}

interface PedidoExportacion {
  type: string;
  filtros: FiltrosReporte;
}

export function useExportReport() {
  return useMutation({ mutationFn: ({ type, filtros }: PedidoExportacion) => exportReport(type, filtros) });
}

export function useExportReportPdf() {
  return useMutation({ mutationFn: ({ type, filtros }: PedidoExportacion) => exportReportPdf(type, filtros) });
}
