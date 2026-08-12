import React from "react";

export function PlaceholderPage({ title }: { title: string }): React.ReactElement {
  return (
    <div>
      <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">{title}</h2>
      <p className="text-[13px] text-text-2">Esta sección todavía no está implementada — próxima sesión.</p>
    </div>
  );
}
