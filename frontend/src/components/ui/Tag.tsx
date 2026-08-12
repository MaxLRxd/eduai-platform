import React from "react";

export type TagColor = "green" | "blue" | "purple" | "amber" | "red" | "gray";

const COLOR_CLASSES: Record<TagColor, string> = {
  green: "bg-success-light text-emerald-800",
  blue: "bg-info-light text-blue-800",
  purple: "bg-violet-100 text-violet-800",
  amber: "bg-warning-light text-amber-800",
  red: "bg-danger-light text-red-900",
  gray: "bg-surface-2 text-text-2",
};

export function Tag({ color = "gray", children }: { color?: TagColor; children: React.ReactNode }): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${COLOR_CLASSES[color]}`}
    >
      {children}
    </span>
  );
}
