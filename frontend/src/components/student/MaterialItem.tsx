import React, { useState } from "react";
import type { CourseMaterial } from "../../types/domain";
import { registerContentAccess } from "../../services/tutor.service";

/**
 * Un material de la materia (CU-A02): los archivos se abren en una pestaña nueva y los textos
 * se leen en la propia plataforma. Cada apertura queda registrada para las estadísticas del docente.
 */
export function MaterialItem({ material, color }: { material: CourseMaterial; color: string }): React.ReactElement {
  const [abierto, setAbierto] = useState(false);
  const url = material.url ?? null;
  const texto = material.texto ?? null;

  const alAbrirTexto = (): void => {
    if (!abierto) void registerContentAccess(material.id);
    setAbierto((v) => !v);
  };

  return (
    <div className="flex items-start gap-3 py-1.5">
      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[13px] text-text-1 font-medium">{material.titulo}</div>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => void registerContentAccess(material.id)}
              className="text-[12px] text-primary hover:underline shrink-0"
            >
              Ver / descargar
            </a>
          ) : texto ? (
            <button
              type="button"
              onClick={alAbrirTexto}
              aria-expanded={abierto}
              className="text-[12px] text-primary hover:underline shrink-0"
            >
              {abierto ? "Ocultar" : "Leer"}
            </button>
          ) : null}
        </div>
        <div className="text-[11px] text-text-3 mt-0.5">
          {material.ragIndexado ? "Disponible para el Tutor IA" : "Pendiente de indexar"}
          {url && material.archivo_nombre ? ` · ${material.archivo_nombre}` : ""}
        </div>
        {abierto && texto && (
          <div className="mt-2 bg-surface-2 border border-border rounded px-3 py-2.5 text-[13px] text-text-1 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
            {texto}
          </div>
        )}
      </div>
    </div>
  );
}
