import React from "react";

export function TableWrap({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-sm mb-5">{children}</div>;
}

export function Table({ children, ariaLabel }: { children: React.ReactNode; ariaLabel?: string }): React.ReactElement {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]" aria-label={ariaLabel}>
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }): React.ReactElement {
  return <thead className="bg-surface-2 border-b border-border">{children}</thead>;
}

export function Th({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <th className="px-4 py-3 text-left text-[10.5px] font-bold text-text-2 uppercase tracking-wide whitespace-nowrap">
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children: React.ReactNode; className?: string }): React.ReactElement {
  return <td className={`px-4 py-2.5 border-b border-border text-text-2 ${className}`}>{children}</td>;
}
