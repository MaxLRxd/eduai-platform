import React, { useState } from "react";
import { useAdminReports, useExportReport } from "../../hooks/useAdminReports";
import { downloadCsv } from "../../services/adminReports.service";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export function AdminReportsPage(): React.ReactElement {
  const { data: reports, isLoading } = useAdminReports();
  const exportReport = useExportReport();
  const [generating, setGenerating] = useState<string | null>(null);

  const handleExport = (type: string): void => {
    setGenerating(type);
    exportReport.mutate(type, {
      onSuccess: (result) => downloadCsv(result),
      onSettled: () => setGenerating(null),
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Reportes</h2>
        <p className="text-[13px] text-text-2">Generación y exportación de informes institucionales</p>
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
            <Button size="sm" onClick={() => handleExport(r.type)} disabled={generating === r.type}>
              {generating === r.type ? "Generando…" : `${r.actionLabel}`}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}