import React, { useState } from "react";
import { useAdminReports, useExportReport } from "../../hooks/useAdminReports";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export function AdminReportsPage(): React.ReactElement {
  const { data: reports, isLoading } = useAdminReports();
  const exportReport = useExportReport();
  const [generating, setGenerating] = useState<string | null>(null);

  const handleExport = (title: string): void => {
    setGenerating(title);
    exportReport.mutate(undefined, { onSettled: () => setGenerating(null) });
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
          <Card key={r.title}>
            <div className="font-display text-sm font-bold text-text-1 mb-2">{r.title}</div>
            <div className="text-xs text-text-2 mb-3.5">{r.description}</div>
            <Button size="sm" onClick={() => handleExport(r.title)} disabled={generating === r.title}>
              {generating === r.title ? "Generando…" : `${r.actionLabel} PDF`}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
