import React, { useState } from "react";
import type { UploadedMaterial } from "../../types/domain";
import { Tag, type TagColor } from "../ui/Tag";

/**
 * Una fila de la lista de materiales de una sección. El nombre abre el material: el archivo
 * subido en otra pestaña, o el texto en la propia lista si el material es un texto.
 */
export function MaterialRow({
  material,
  icon,
  rag,
}: {
  material: UploadedMaterial;
  icon: string;
  rag: { color: TagColor; label: string };
}): React.ReactElement {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-sm bg-surface-2 flex items-center justify-center text-sm shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          {material.url ? (
            <a
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-text-1 truncate block hover:text-primary hover:underline"
            >
              {material.name}
            </a>
          ) : material.text ? (
            <button
              type="button"
              onClick={() => setAbierto((v) => !v)}
              aria-expanded={abierto}
              className="text-xs font-semibold text-text-1 truncate block max-w-full text-left hover:text-primary hover:underline"
            >
              {material.name}
            </button>
          ) : (
            <div className="text-xs font-semibold text-text-1 truncate">{material.name}</div>
          )}
          <div className="text-[11px] text-text-3">
            {material.sizeLabel} · {material.date}
          </div>
        </div>
        <Tag color={rag.color}>{rag.label}</Tag>
      </div>
      {abierto && material.text && (
        <div className="mt-2 ml-[42px] bg-surface-2 border border-border rounded px-3 py-2.5 text-xs text-text-1 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
          {material.text}
        </div>
      )}
    </div>
  );
}
