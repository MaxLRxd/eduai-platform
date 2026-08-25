import React from "react";

type Variant = "info" | "warning";

const VARIANT_CLASSES: Record<Variant, string> = {
  info: "bg-info-light border-blue-200 text-blue-900",
  warning: "bg-warning-light border-amber-200 text-amber-900",
};

export function InfoBox({ variant = "info", children }: { variant?: Variant; children: React.ReactNode }): React.ReactElement {
  return <div className={`border rounded px-3.5 py-2.5 text-[13px] font-medium mb-5 ${VARIANT_CLASSES[variant]}`}>{children}</div>;
}
