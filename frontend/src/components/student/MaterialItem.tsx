import React, { useState } from "react";
import type { CourseMaterial } from "../../types/domain";
import { registerContentAccess } from "../../services/tutor.service";
import { reportarProblemaMaterial } from "../../services/content.service";
import { apiErrorMessage } from "../../services/api";

type EstadoReporte = "cerrado" | "escribiendo" | "enviando" | "enviado";

/**
 * Un material de la materia (CU-A02): los archivos se abren en una pestaña nueva y los textos
 * se leen en la propia plataforma. Cada apertura queda registrada para las estadísticas del docente.
 *
 * Flujo 5A: si el archivo no se puede servir (el servidor detectó que ya no está) se muestra un aviso y se
 * invita a reportarlo; y aunque el archivo exista, el alumno puede reportar que no abre o está dañado.
 */
export function MaterialItem({ material, color }: { material: CourseMaterial; color: string }): React.ReactElement {
  const [abierto, setAbierto] = useState(false);
  const [reporte, setReporte] = useState<EstadoReporte>("cerrado");
  const [motivo, setMotivo] = useState("");
  const [errorReporte, setErrorReporte] = useState<string | null>(null);
  const url = material.url ?? null;
  const texto = material.texto ?? null;
  const faltante = url !== null && material.disponible === false;

  const alAbrirTexto = (): void => {
    if (!abierto) void registerContentAccess(material.id);
    setAbierto((v) => !v);
  };

  const enviarReporte = async (): Promise<void> => {
    setReporte("enviando");
    setErrorReporte(null);
    try {
      await reportarProblemaMaterial(material.id, motivo);
      setReporte("enviado");
    } catch (e) {
      setErrorReporte(apiErrorMessage(e, "No se pudo enviar el reporte."));
      setReporte("escribiendo");
    }
  };

  return (
    <div className="flex items-start gap-3 py-1.5">
      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          {/* El nombre abre el material: el archivo en otra pestana o el texto en la propia pantalla. */}
          {url && !faltante ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => void registerContentAccess(material.id)}
              className="text-[13px] text-text-1 font-medium hover:text-primary hover:underline"
            >
              {material.titulo}
            </a>
          ) : texto ? (
            <button
              type="button"
              onClick={alAbrirTexto}
              aria-expanded={abierto}
              className="text-left text-[13px] text-text-1 font-medium hover:text-primary hover:underline"
            >
              {material.titulo}
            </button>
          ) : (
            <div className="text-[13px] text-text-1 font-medium">{material.titulo}</div>
          )}
          {url && !faltante ? (
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

        {url && reporte === "enviado" && (
          <p role="status" className="mt-1.5 text-[11px] text-success">
            Reporte enviado: tu docente fue avisado.
          </p>
        )}

        {url && reporte !== "enviado" && faltante && reporte === "cerrado" && (
          <div role="alert" className="mt-1.5 text-[12px] text-red-800 bg-danger-light border border-red-300 rounded px-2.5 py-2">
            Este archivo no está disponible en este momento.{" "}
            <button type="button" onClick={() => setReporte("escribiendo")} className="font-semibold underline">
              Reportar el problema
            </button>
          </div>
        )}

        {url && reporte === "cerrado" && !faltante && (
          <button
            type="button"
            onClick={() => setReporte("escribiendo")}
            className="mt-1 text-[11px] text-text-3 hover:text-primary hover:underline"
          >
            ¿No abre? Reportalo
          </button>
        )}

        {url && (reporte === "escribiendo" || reporte === "enviando") && (
          <form
            className="mt-1.5 flex flex-col gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              void enviarReporte();
            }}
          >
            <textarea
              aria-label={`Contanos qué pasa con ${material.titulo}`}
              value={motivo}
              maxLength={300}
              rows={2}
              disabled={reporte === "enviando"}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Contanos qué pasa (opcional): no abre, se ve cortado, dice error…"
              className="w-full px-2.5 py-1.5 border border-border rounded text-[12px]"
            />
            {errorReporte && <p className="text-[11px] text-danger">{errorReporte}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={reporte === "enviando"}
                className="px-2.5 py-1 text-[11px] font-semibold rounded bg-primary text-white disabled:opacity-60"
              >
                {reporte === "enviando" ? "Enviando…" : "Enviar reporte"}
              </button>
              <button
                type="button"
                disabled={reporte === "enviando"}
                onClick={() => {
                  setReporte("cerrado");
                  setErrorReporte(null);
                }}
                className="px-2.5 py-1 text-[11px] rounded border border-border text-text-2"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
