import React, { useRef, useState } from "react";
import { useResumen } from "../../hooks/useTutorTools";
import {
  descargarResumenPdf,
  FORMATOS_ARCHIVO_RESUMEN,
  MAX_ARCHIVO_RESUMEN_MB,
  validarArchivoResumen,
} from "../../services/tutor.service";
import { apiErrorMessage } from "../../services/api";
import type { Course } from "../../types/domain";
import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";

const TEXTO_MINIMO = 200;

export function ResumenPanel({ course }: { course: Course }): React.ReactElement {
  const { resultado, pending, error, resumir, limpiar } = useResumen();
  const [contenidoId, setContenidoId] = useState("");
  const [texto, setTexto] = useState("");
  const [modo, setModo] = useState<"material" | "texto" | "archivo">("material");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoError, setArchivoError] = useState<string | null>(null);
  const archivoInputRef = useRef<HTMLInputElement>(null);
  const [pdfPendiente, setPdfPendiente] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const resumibles = course.materiales.filter((m) => m.resumible);
  const usandoTexto = modo === "texto";
  const usandoArchivo = modo === "archivo";
  const puedeEnviar =
    !pending &&
    (usandoArchivo ? archivo !== null && archivoError === null : usandoTexto ? texto.trim().length >= TEXTO_MINIMO : Boolean(contenidoId));

  function elegirArchivo(file: File | null): void {
    setArchivo(file);
    setArchivoError(file ? validarArchivoResumen(file) : null);
  }

  function quitarArchivo(): void {
    elegirArchivo(null);
    if (archivoInputRef.current) archivoInputRef.current.value = "";
  }

  function enviar(): void {
    if (usandoArchivo) {
      if (archivo) void resumir(course.id, { archivo });
    } else if (usandoTexto) {
      void resumir(course.id, { texto: texto.trim() });
    } else if (contenidoId) {
      void resumir(course.id, { contenido_id: contenidoId });
    }
  }

  return (
    <Card>
      <CardHeader
        title="📄 Resumir material"
        action={
          resultado || error ? (
            <Button variant="ghost" size="sm" onClick={limpiar}>
              Limpiar
            </Button>
          ) : undefined
        }
      />

      <div className="flex gap-2 mb-3">
        <Button
          size="sm"
          variant={modo === "material" ? "primary" : "secondary"}
          onClick={() => setModo("material")}
        >
          Del material
        </Button>
        <Button
          size="sm"
          variant={modo === "texto" ? "primary" : "secondary"}
          onClick={() => setModo("texto")}
        >
          De un texto
        </Button>
        <Button
          size="sm"
          variant={modo === "archivo" ? "primary" : "secondary"}
          onClick={() => setModo("archivo")}
        >
          De un archivo
        </Button>
      </div>

      {modo === "material" &&
        (resumibles.length === 0 ? (
          <p className="text-[12px] text-text-2 leading-relaxed">
            Esta materia todavia no tiene materiales de texto. El profesor puede subirlos desde su panel de
            contenido.
          </p>
        ) : (
          <select
            className="w-full px-3 py-2 border border-border rounded text-sm mb-2.5"
            value={contenidoId}
            onChange={(e) => setContenidoId(e.target.value)}
          >
            <option value="">Elegí un material…</option>
            {resumibles.map((m) => (
              <option key={m.id} value={m.id}>
                {m.titulo}
              </option>
            ))}
          </select>
        ))}

      {usandoArchivo && (
        <div className="mb-2.5">
          <label htmlFor="resumen-archivo" className="block text-xs font-semibold text-text-1 mb-1.5">
            Adjuntá tu archivo
          </label>
          <input
            id="resumen-archivo"
            ref={archivoInputRef}
            type="file"
            accept={FORMATOS_ARCHIVO_RESUMEN.map((f) => `.${f}`).join(",")}
            onChange={(e) => elegirArchivo(e.target.files?.[0] ?? null)}
            className="w-full text-[12px] text-text-2"
          />
          <p className="text-[11px] text-text-3 mt-1.5 leading-relaxed">
            PDF, Word, PowerPoint, texto o imagen, hasta {MAX_ARCHIVO_RESUMEN_MB} MB. Se lee para resumirlo y se
            descarta: no se guarda ni lo ven tu docente u otros alumnos.
          </p>
          {archivo && (
            <div className="flex items-center justify-between gap-2 mt-2 text-[12px] text-text-1 bg-surface-2 rounded px-2.5 py-1.5">
              <span className="truncate">{archivo.name}</span>
              <button type="button" onClick={quitarArchivo} className="text-primary hover:underline shrink-0">
                Quitar
              </button>
            </div>
          )}
          {archivoError && (
            <p role="alert" className="text-[12px] text-red-700 mt-1.5">
              {archivoError}
            </p>
          )}
        </div>
      )}

      {usandoTexto && (
        <textarea
          className="w-full px-3 py-2 border border-border rounded text-sm mb-2.5"
          rows={5}
          placeholder={`Pegá aca el texto a resumir (mínimo ${TEXTO_MINIMO} caracteres)…`}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      )}

      {!resultado && !error && (
        <Button
          fullWidth
          className="justify-center"
          disabled={!puedeEnviar}
          onClick={enviar}
        >
          {pending ? "Generando resumen…" : "Generar resumen"}
        </Button>
      )}

      {error && (
        <div className="bg-danger-light border border-red-300 rounded px-3 py-2.5 text-[13px] text-red-800">
          {error}
        </div>
      )}

      {resultado && (
        <div className="flex flex-col gap-2.5">
          {resultado.origen && (
            <div className="text-[11px] text-text-3">
              Resumen de <strong className="text-text-2">{resultado.origen}</strong> ·{" "}
              {resultado.max_palabras} palabras máx.
            </div>
          )}
          {resultado.truncado && (
            <div className="text-[11px] text-amber-800 bg-warning-light border border-amber-200 rounded px-2.5 py-1.5">
              El archivo es muy largo: se resumió solo el comienzo.
            </div>
          )}
          <div className="bg-surface-2 rounded p-3 text-[13px] text-text-1 leading-relaxed whitespace-pre-wrap">
            {resultado.resumen}
          </div>
          <div>
            <Button
              variant="secondary"
              size="sm"
              disabled={pdfPendiente}
              onClick={() => {
                setPdfError(null);
                setPdfPendiente(true);
                descargarResumenPdf(course.id, resultado.origen ? `Resumen - ${resultado.origen}` : "Resumen", resultado.resumen)
                  .catch((e: unknown) => setPdfError(apiErrorMessage(e, "No se pudo generar el PDF.")))
                  .finally(() => setPdfPendiente(false));
              }}
            >
              {pdfPendiente ? "Generando PDF…" : "📄 Descargar PDF"}
            </Button>
            {pdfError && <p className="text-[11px] text-red-700 mt-1.5">{pdfError}</p>}
          </div>
        </div>
      )}
    </Card>
  );
}
