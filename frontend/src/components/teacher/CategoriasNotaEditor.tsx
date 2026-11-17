import React, { useState } from "react";
import { Button } from "../ui/Button";
import { apiErrorMessage } from "../../services/api";
import { resumenPesos, type CategoriaNota } from "../../services/calificaciones.service";

interface Fila {
  id?: string;
  nombre: string;
  peso: string;
}

function aFilas(categorias: CategoriaNota[]): Fila[] {
  return categorias.map((c) => ({ id: c.id, nombre: c.nombre, peso: String(c.peso) }));
}

/**
 * Categorías de calificación de la materia (TP, Parcial, Final…) con su peso en la nota final.
 * Los pesos deben sumar 100. Sin categorías, la nota final es el promedio simple de todas las notas.
 */
export function CategoriasNotaEditor({
  categorias,
  guardando,
  error,
  onGuardar,
}: {
  categorias: CategoriaNota[];
  guardando: boolean;
  error: unknown;
  onGuardar: (categorias: { id?: string; nombre: string; peso: number }[]) => void;
}): React.ReactElement {
  const [filas, setFilas] = useState<Fila[]>(() => aFilas(categorias));

  const pesos = filas.map((f) => Number(f.peso.replace(",", ".")));
  const { suma, correcto } = resumenPesos(pesos);
  const nombres = filas.map((f) => f.nombre.trim().toLowerCase());
  const repetidos = new Set(nombres).size !== nombres.length;
  const incompletas = filas.some((f) => !f.nombre.trim() || !(Number(f.peso.replace(",", ".")) > 0));
  const sinCategorias = filas.length === 0;
  const valido = sinCategorias || (correcto && !repetidos && !incompletas);

  const cambiar = (i: number, cambio: Partial<Fila>): void =>
    setFilas((prev) => prev.map((f, j) => (j === i ? { ...f, ...cambio } : f)));

  const repartir = (): void => {
    if (filas.length === 0) return;
    const base = Math.floor((10000 / filas.length)) / 100;
    const ultimo = Math.round((100 - base * (filas.length - 1)) * 100) / 100;
    setFilas((prev) => prev.map((f, i) => ({ ...f, peso: String(i === prev.length - 1 ? ultimo : base) })));
  };

  const guardar = (): void =>
    onGuardar(filas.map((f, i) => ({ id: f.id, nombre: f.nombre.trim(), peso: pesos[i] })));

  return (
    <div className="border border-border rounded bg-surface p-4 mb-4">
      <div className="font-display text-sm font-bold text-text-1 mb-1">Categorías y pesos</div>
      <p className="text-[11px] text-text-2 mb-3">
        La nota final es el promedio de cada categoría ponderado por su peso. Si una categoría todavía no tiene notas
        de un alumno, no lo perjudica: su peso se reparte entre las demás. Sin categorías, es el promedio simple.
      </p>

      <div className="flex flex-col gap-2 mb-3">
        {filas.map((f, i) => (
          <div key={f.id ?? `nueva-${i}`} className="flex items-center gap-2">
            <input
              aria-label={`Nombre de la categoría ${i + 1}`}
              value={f.nombre}
              onChange={(e) => cambiar(i, { nombre: e.target.value })}
              placeholder="Ej: Trabajos prácticos"
              maxLength={80}
              className="flex-1 min-w-0 px-3 py-2 border border-border rounded text-sm"
            />
            <input
              aria-label={`Peso de la categoría ${i + 1}`}
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={f.peso}
              onChange={(e) => cambiar(i, { peso: e.target.value })}
              className="w-24 px-3 py-2 border border-border rounded text-sm"
            />
            <span className="text-xs text-text-2">%</span>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Quitar la categoría ${f.nombre || i + 1}`}
              onClick={() => setFilas((prev) => prev.filter((_, j) => j !== i))}
            >
              Quitar
            </Button>
          </div>
        ))}
        {sinCategorias && (
          <p className="text-xs text-text-3">Sin categorías: la nota final es el promedio simple de todas las notas.</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="secondary" size="sm" onClick={() => setFilas((prev) => [...prev, { nombre: "", peso: "" }])}>
          + Categoría
        </Button>
        <Button variant="ghost" size="sm" onClick={repartir} disabled={filas.length === 0}>
          Repartir en partes iguales
        </Button>
        {!sinCategorias && (
          <span className={`text-xs font-semibold ${correcto ? "text-success" : "text-danger"}`}>
            Suman {suma}% {correcto ? "✓" : "(deben sumar 100)"}
          </span>
        )}
        <div className="flex-1" />
        <Button size="sm" onClick={guardar} disabled={!valido || guardando}>
          {guardando ? "Guardando…" : "Guardar categorías"}
        </Button>
      </div>

      {repetidos && <p className="text-xs text-danger mt-2">Hay categorías con el mismo nombre.</p>}
      {incompletas && !sinCategorias && (
        <p className="text-xs text-danger mt-2">Cada categoría necesita un nombre y un peso mayor a 0.</p>
      )}
      {error != null && (
        <p className="text-xs text-danger mt-2">{apiErrorMessage(error, "No se pudieron guardar las categorías")}</p>
      )}
    </div>
  );
}
