import { api } from "./api";
import type { ReportCard } from "../types/domain";

interface ReportApi {
  type: string;
  title: string;
  description: string;
  headline: string;
  stats: { label: string; value: string }[];
  footnote: string;
}

const EXPORT_LABELS: Record<string, string> = {
  ejecutivo: "Generar",
};

export interface FiltrosReporte {
  /** AAAA-1 (ene-jun) o AAAA-2 (jul-dic); vacio = todos. */
  periodo: string;
  /** Id de materia; vacio = todas. */
  materiaId: string;
}

export const SIN_FILTROS: FiltrosReporte = { periodo: "", materiaId: "" };

function consulta(filtros: FiltrosReporte, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams(extra);
  if (filtros.periodo) params.set("periodo", filtros.periodo);
  if (filtros.materiaId) params.set("materia_id", filtros.materiaId);
  const texto = params.toString();
  return texto ? `?${texto}` : "";
}

export async function getAdminReports(filtros: FiltrosReporte = SIN_FILTROS): Promise<ReportCard[]> {
  const data = await api<{ reports: ReportApi[] }>(`/api/admin/reports${consulta(filtros)}`);
  return (data.reports ?? []).map((r) => ({
    ...r,
    actionLabel: EXPORT_LABELS[r.type] ?? "Exportar",
  }));
}

export interface ExportResult {
  filename: string;
  csv: string;
}

export interface ExportPdfResult {
  filename: string;
  pdf: string;
}

// GET /api/admin/reports/:type/export — CSV con el detalle del reporte.
export async function exportReport(type: string, filtros: FiltrosReporte = SIN_FILTROS): Promise<ExportResult> {
  return api<ExportResult>(`/api/admin/reports/${type}/export${consulta(filtros)}`);
}

// GET /api/admin/reports/:type/export?format=pdf — PDF con el detalle del reporte.
export async function exportReportPdf(type: string, filtros: FiltrosReporte = SIN_FILTROS): Promise<ExportPdfResult> {
  return api<ExportPdfResult>(`/api/admin/reports/${type}/export${consulta(filtros, { format: "pdf" })}`);
}

export function downloadCsv(result: ExportResult): void {
  const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadPdf(result: ExportPdfResult): void {
  const bytes = Uint8Array.from(atob(result.pdf), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}