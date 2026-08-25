import React from "react";

export function Card({
  className = "",
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      className={`bg-surface border border-border rounded-lg p-5 shadow-sm transition-all hover:border-border-strong hover:shadow ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  action,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between mb-4">
      <span className="font-display text-sm font-bold text-text-1">{title}</span>
      {action}
    </div>
  );
}
