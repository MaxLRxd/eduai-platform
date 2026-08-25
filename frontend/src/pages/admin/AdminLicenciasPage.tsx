import React from "react";
import { useAdminLicensing } from "../../hooks/useAdminLicensing";
import { Card, CardHeader } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Tag } from "../../components/ui/Tag";

export function AdminLicenciasPage(): React.ReactElement {
  const { usage, plans } = useAdminLicensing();
  const current = usage.data?.current ?? 0;
  const limit = usage.data?.limit ?? 1;
  const pct = (current / limit) * 100;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Licencias MAU</h2>
        <p className="text-[13px] text-text-2">Modelo de licenciamiento por alumnos activos mensuales</p>
      </div>

      <div className="grid xl:grid-cols-[2fr_1fr] gap-5">
        <Card>
          <CardHeader
            title={
              <>
                Plan actual: <span className="text-primary">Growth</span>
              </>
            }
            action={<Tag color="blue">101 – 500 MAU</Tag>}
          />
          <div className="flex items-end gap-2.5 mb-3.5">
            <div className="font-display text-5xl font-extrabold text-text-1 leading-none">{current}</div>
            <div className="text-[13px] text-text-2 pb-2">/ {limit} MAU</div>
          </div>
          <div className="mb-2">
            <ProgressBar value={pct} />
          </div>
          <div className="text-xs text-text-2">
            {pct.toFixed(1)}% de capacidad · <strong>{limit - current} disponibles</strong>
          </div>
        </Card>

        <Card>
          <CardHeader title="Planes disponibles" />
          <div className="flex flex-col gap-2">
            {(plans.data ?? []).map((p) => (
              <div
                key={p.name}
                className={`p-2.5 rounded border-[1.5px] ${p.current ? "border-primary bg-primary-light" : "border-border"}`}
              >
                <div className="flex justify-between mb-0.5">
                  <span className={`font-bold ${p.current ? "text-primary" : "text-text-1"}`}>
                    {p.name}
                    {p.current ? " ← Actual" : ""}
                  </span>
                  <Tag color={p.current ? "blue" : "gray"}>{p.range}</Tag>
                </div>
                <div className="text-xs text-text-2">{p.features}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
