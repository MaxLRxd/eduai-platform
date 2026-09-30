import React from "react";

type Variant = "info" | "warning" | "success" | "error";

const VARIANT_CLASSES: Record<Variant, string> = {
  info: "bg-info-light border-blue-200 text-blue-900",
  warning: "bg-warning-light border-amber-200 text-amber-900",
  success: "bg-success-light border-emerald-200 text-emerald-900",
  error: "bg-danger-light border-red-200 text-red-900",
};

export function InfoBox({ variant = "info", children }: { variant?: Variant; children: React.ReactNode }): React.ReactElement {
  return <div className={`border rounded px-3.5 py-2.5 text-[13px] font-medium mb-5 ${VARIANT_CLASSES[variant]}`}>{children}</div>;
}
