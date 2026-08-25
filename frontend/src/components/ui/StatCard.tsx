import React from "react";
import { Icon, type IconKey } from "./icons";

export function StatCard({
  icon,
  label,
  value,
  meta,
  accent = "#003d7a",
  accentLight = "#dbeafe",
}: {
  icon: IconKey;
  label: string;
  value: React.ReactNode;
  meta?: string;
  accent?: string;
  accentLight?: string;
}): React.ReactElement {
  return (
    <div className="relative overflow-hidden bg-surface border border-border rounded-lg p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: accent }} />
      <div className="w-9 h-9 rounded-[9px] flex items-center justify-center mb-3" style={{ background: accentLight }}>
        <Icon name={icon} className="w-5 h-5" />
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-text-2 mb-1.5">{label}</div>
      <div className="font-display text-3xl font-extrabold text-text-1 leading-none tracking-tight">{value}</div>
      {meta && <div className="text-[11px] text-text-3 mt-1.5">{meta}</div>}
    </div>
  );
}
