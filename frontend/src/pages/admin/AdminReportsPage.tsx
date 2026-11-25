import React, { useState } from "react";
import { useAdminReports, useExportReport, useExportReportPdf } from "../../hooks/useAdminReports";
import { useAdminSubjects } from "../../hooks/useAdminSubjects";
import { downloadCsv, downloadPdf, SIN_FILTROS, type FiltrosReporte } from "../../services/adminReports.service";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

/** Periodos ofrecidos: el anio en curso y el anterior (AAAA-1 = ene-jun, AAAA-2 = jul-dic). */
function periodosDisponibles(): string[] {
  const anio = new Date().getFullYear();
  return [`${anio}-2`, `${anio}-1`, `${anio - 1}-2`, `${anio - 1}-1`];
}

export function AdminReportsPage(): React.ReactElement {
  const [filtros, setFiltros] = useState<FiltrosReporte>(SIN_FILTROS);
  const { data: reports, isLoading } = useAdminReports(filtros);
  const { data: materias } = useAdminSubjects();
  const exportReport = useExportReport();
  const exportReportPdf = useExportReportPdf();
  const [generating, setGenerating] = useState<string | null>(null);

  const handleExportCsv = (type: string): void => {
    setGenerating(`${type}:csv`);
    exportReport.mutate({ type, filtros }, {
      onSuccess: (result) => downloadCsv(result),
      onSettled: () => setGenerating(null),
    });
  };

  const handleExportPdf = (type: string): void => {
    setGenerating(`${type}:pdf`);
    exportReportPdf.mutate({ type, filtros }, {
      onSuccess: (result) => downloadPdf(result),
      onSettled: () => setGenerating(null),
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Reportes</h2>
        <p className="text-[13px] text-text-2">Generación y exportación de informes institucionales</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <label htmlFor="reporte-periodo" className="block text-[11px] font-semibold text-text-2 mb-1">
            Período
          </label>
          <select
            id="reporte-periodo"
            value={filtros.periodo}
            onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
            className="px-3 py-2 border border-border rounded text-sm bg-surface"
          >
            <option value="">Todos los períodos</option>
            {periodosDisponibles().map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="reporte-materia" className="block text-[11px] font-semibold text-text-2 mb-1">
            Materia
          </label>
          <select
            id="reporte-materia"
            value={filtros.materiaId}
            onChange={(e) => setFiltros({ ...filtros, materiaId: e.target.value })}
            className="px-3 py-2 border border-border rounded text-sm bg-surface"
          >
            <option value="">Todas las materias</option>
            {(materias ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>
        {(filtros.periodo || filtros.materiaId) && (
          <Button variant="ghost" size="sm" onClick={() => setFiltros(SIN_FILTROS)}>
            Quitar filtros
          </Button>
        )}
        <p className="text-[11px] text-text-3 basis-full">
          El filtro aplica a asistencia, notas, tutor y alertas. Retención y uso de la plataforma miden los últimos 30 días.
        </p>
      </div>

      {isLoading && <p className="text-sm text-text-2">Cargando reportes…</p>}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4.5">
        {(reports ?? []).map((r) => (
          <Card key={r.type}>
            <div className="font-display text-sm font-bold text-text-1 mb-1">{r.title}</div>
            <div className="text-xs text-text-2 mb-3">{r.description}</div>
            <div className="font-display text-[26px] font-extrabold text-text-1 leading-tight mb-3">{r.headline}</div>
            <div className="flex flex-col gap-1.5 mb-3.5">
              {r.stats.map((s) => (
                <div key={s.label} className="flex justify-between items-baseline gap-2 text-[12.5px]">
                  <span className="text-text-2">{s.label}</span>
                  <strong className="text-text-1 text-[13px]">{s.value}</strong>
                </div>
              ))}
            </div>
            <div className="text-[10.5px] text-text-3 mb-3">{r.footnote}</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleExportCsv(r.type)}
                disabled={generating !== null}
              >
                {generating === `${r.type}:csv` ? "Generando…" : `${r.actionLabel} CSV`}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleExportPdf(r.type)}
                disabled={generating !== null}
              >
                {generating === `${r.type}:pdf` ? "Generando…" : "Exportar PDF"}
              </Button>
            </div>
          </Card>
        ))}
        {!isLoading && (reports ?? []).length === 0 && (
          <div className="md:col-span-2 xl:col-span-3 bg-surface border border-border rounded-lg py-8 text-center text-[12px] text-text-3">
            Todavía no hay datos para generar reportes.
          </div>
        )}
      </div>
    </div>
  );
}
