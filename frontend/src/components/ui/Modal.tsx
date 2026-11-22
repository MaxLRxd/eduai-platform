import React from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}): React.ReactElement | null {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-5"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className={`bg-surface rounded-lg shadow-lg w-full max-h-[85vh] overflow-y-auto relative ${wide ? "max-w-3xl" : "max-w-md"}`} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3.5 right-3.5 w-7.5 h-7.5 bg-surface-2 border border-border rounded-md flex items-center justify-center text-text-2 hover:bg-danger-light hover:text-danger transition-colors"
        >
          ×
        </button>
        <div className="px-5 pt-5 pb-4 border-b border-border font-display text-[15px] font-bold text-text-1">{title}</div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
