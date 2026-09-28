import React, { useState } from "react";
import { useResumen } from "../../hooks/useTutorTools";
import type { Course } from "../../types/domain";
import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";

const TEXTO_MINIMO = 200;

export function ResumenPanel({ course }: { course: Course }): React.ReactElement {
  const { resultado, pending, error, resumir, limpiar } = useResumen();
  const [contenidoId, setContenidoId] = useState("");
  const [texto, setTexto] = useState("");
  const [modo, setModo] = useState<"material" | "texto">("material");

  const resumibles = course.materiales.filter((m) => m.resumible);
  const usandoTexto = modo === "texto";
  const puedeEnviar = pending || (usandoTexto ? texto.trim().length >= TEXTO_MINIMO : Boolean(contenidoId));

  function enviar(): void {
    if (usandoTexto) {
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
      </div>

      {!usandoTexto &&
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
          <div className="bg-surface-2 rounded p-3 text-[13px] text-text-1 leading-relaxed whitespace-pre-wrap">
            {resultado.resumen}
          </div>
        </div>
      )}
    </Card>
  );
}
