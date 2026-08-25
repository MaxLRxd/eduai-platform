import React from "react";

export function ProgressBar({ value, color }: { value: number; color?: string }): React.ReactElement {
  return (
    <div className="w-full h-1.5 bg-surface-2 rounded overflow-hidden">
      <div
        className="h-full rounded transition-[width] duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color ?? "#003d7a" }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
