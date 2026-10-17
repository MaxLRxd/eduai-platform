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

export async function getAdminReports(): Promise<ReportCard[]> {
  const data = await api<{ reports: ReportApi[] }>("/api/admin/reports");
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
export async function exportReport(type: string): Promise<ExportResult> {
  return api<ExportResult>(`/api/admin/reports/${type}/export`);
}

// GET /api/admin/reports/:type/export?format=pdf — PDF con el detalle del reporte.
export async function exportReportPdf(type: string): Promise<ExportPdfResult> {
  return api<ExportPdfResult>(`/api/admin/reports/${type}/export?format=pdf`);
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