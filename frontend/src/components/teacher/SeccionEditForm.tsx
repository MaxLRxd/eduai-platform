import React, { useState } from "react";
import { Button } from "../ui/Button";

type Tipo = "TEORIA" | "PRACTICA";

/** Formulario en línea para renombrar una unidad y cambiar su tipo. */
export function SeccionEditForm({
  nombre,
  tipo,
  guardando,
  error,
  onGuardar,
  onCancelar,
}: {
  nombre: string;
  tipo: string;
  guardando: boolean;
  error: string | null;
  onGuardar: (cambios: { nombre: string; tipo: Tipo }) => void;
  onCancelar: () => void;
}): React.ReactElement {
  const tipoInicial: Tipo = tipo === "PRACTICA" ? "PRACTICA" : "TEORIA";
  const [nuevoNombre, setNuevoNombre] = useState(nombre);
  const [nuevoTipo, setNuevoTipo] = useState<Tipo>(tipoInicial);

  const limpio = nuevoNombre.trim();
  const sinCambios = limpio === nombre && nuevoTipo === tipoInicial;

  return (
    <form
      className="px-3 py-2.5 border-b border-border bg-surface flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (limpio && !sinCambios) onGuardar({ nombre: limpio, tipo: nuevoTipo });
      }}
    >
      <div className="flex gap-2 flex-wrap items-end">
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="edit-seccion-nombre" className="block text-xs font-semibold text-text-1 mb-1">
            Nombre de la unidad
          </label>
          <input
            id="edit-seccion-nombre"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            maxLength={150}
            autoFocus
            className="w-full px-3 py-2 border border-border rounded text-sm"
          />
        </div>
        <div>
          <label htmlFor="edit-seccion-tipo" className="block text-xs font-semibold text-text-1 mb-1">
            Tipo
          </label>
          <select
            id="edit-seccion-tipo"
            value={nuevoTipo}
            onChange={(e) => setNuevoTipo(e.target.value as Tipo)}
            className="px-3 py-2 border border-border rounded text-sm bg-surface"
          >
            <option value="TEORIA">Teoría</option>
            <option value="PRACTICA">Práctica</option>
          </select>
        </div>
        <Button type="submit" size="sm" disabled={!limpio || sinCambios || guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}
