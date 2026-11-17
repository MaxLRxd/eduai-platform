import React, { useState } from "react";
import { Button } from "../ui/Button";
import { apiErrorMessage } from "../../services/api";
import type { CategoriaNota } from "../../services/calificaciones.service";
import { useImportarNotasDeActividad } from "../../hooks/useCalificaciones";
import { useTeacherActivities } from "../../hooks/useActivities";

/**
 * Trae a Calificaciones las notas de una actividad (TP, examen…). Solo importa las correcciones que el
 * docente ya publicó, así una nota sugerida por la IA nunca entra a la nota final por sí sola.
 */
export function ImportarNotasActividad({
  courseId,
  categorias,
  periodoInicial,
}: {
  courseId: string;
  categorias: CategoriaNota[];
  periodoInicial: string;
}): React.ReactElement {
  const { data: actividades } = useTeacherActivities(courseId);
  const importar = useImportarNotasDeActividad(courseId);
  const [actividadId, setActividadId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [periodo, setPeriodo] = useState(periodoInicial);

  const disponibles = (actividades ?? []).filter((a) => a.activo);
  const elegida = actividadId || disponibles[0]?.id || "";
  const resultado = importar.data;

  return (
    <div className="border border-border rounded bg-surface p-4 mb-4">
      <div className="font-display text-sm font-bold text-text-1 mb-1">Importar notas de una actividad</div>
      <p className="text-[11px] text-text-2 mb-3">
        Trae las correcciones <strong>publicadas</strong> de una actividad como notas ligadas a ella. Podés repetirlo:
        actualiza las ya importadas, no las duplica.
      </p>

      {disponibles.length === 0 ? (
        <p className="text-xs text-text-3">Esta materia todavía no tiene actividades activas.</p>
      ) : (
        <div className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <label htmlFor="imp-actividad" className="block text-xs font-semibold text-text-1 mb-1.5">
              Actividad
            </label>
            <select
              id="imp-actividad"
              value={elegida}
              onChange={(e) => setActividadId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
            >
              {disponibles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="imp-categoria" className="block text-xs font-semibold text-text-1 mb-1.5">
              Categoría
            </label>
            <select
              id="imp-categoria"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.peso}%)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="imp-periodo" className="block text-xs font-semibold text-text-1 mb-1.5">
              Período
            </label>
            <input
              id="imp-periodo"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded text-sm"
            />
          </div>
          <Button
            size="sm"
            disabled={!elegida || !periodo.trim() || importar.isPending}
            onClick={() =>
              importar.mutate({
                actividadId: elegida,
                input: { periodo: periodo.trim(), categoria_id: categoriaId || null },
              })
            }
          >
            {importar.isPending ? "Importando…" : "Importar notas"}
          </Button>
        </div>
      )}

      {resultado && (
        <p className="text-xs text-success mt-3">
          {resultado.creadas} nota(s) nueva(s), {resultado.actualizadas} actualizada(s).
          {resultado.sin_publicar > 0 &&
            ` ${resultado.sin_publicar} entrega(s) sin publicar no se importaron: publicalas desde Correcciones.`}
        </p>
      )}
      {importar.isError && (
        <p className="text-xs text-danger mt-3">{apiErrorMessage(importar.error, "No se pudieron importar las notas")}</p>
      )}
    </div>
  );
}
