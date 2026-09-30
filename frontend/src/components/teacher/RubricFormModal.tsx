import React, { useState } from "react";
import { Button } from "../ui/Button";
import { InfoBox } from "../ui/InfoBox";
import { Modal } from "../ui/Modal";
import { apiErrorMessage } from "../../services/api";
import type { RubricCriterionInput, RubricInput } from "../../services/corrections.service";
import type { Rubric } from "../../types/domain";

type Criterio = RubricCriterionInput;

const criterioVacio = (): Criterio => ({ nombre: "", peso: 0, esperado: "" });

interface Props {
  open: boolean;
  rubric: Rubric | null;
  onClose: () => void;
  onSave: (input: RubricInput) => void;
  saving: boolean;
  error: string | null;
}

/**
 * CU-P04. El campo `esperado` es lo que hace util la rubrica: sin el, la IA solo
 * sabe cuanto pesa cada criterio y no que tiene que buscar en la entrega.
 */
export function RubricFormModal({ open, rubric, onClose, onSave, saving, error }: Props): React.ReactElement | null {
  const [nombre, setNombre] = useState(rubric?.name ?? "");
  const [descripcion, setDescripcion] = useState(rubric?.description ?? "");
  const [criterios, setCriterios] = useState<Criterio[]>(
    rubric?.criterios.length
      ? rubric.criterios.map((c) => ({
          nombre: c.name,
          peso: Number.parseFloat(c.weight) || 0,
          esperado: c.expected,
        }))
      : [criterioVacio()]
  );

  const sumaPesos = criterios.reduce((total, c) => total + (Number.isFinite(c.peso) ? c.peso : 0), 0);
  const pesosOk = Math.abs(sumaPesos - 100) < 0.01;
  const faltanEsperado = criterios.some((c) => !c.esperado.trim());
  const faltanNombre = criterios.some((c) => !c.nombre.trim());
  const valido = nombre.trim() && criterios.length > 0 && pesosOk && !faltanEsperado && !faltanNombre;

  const patch = (i: number, cambio: Partial<Criterio>): void => {
    setCriterios((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...cambio } : c)));
  };

  const distribuir = (): void => {
    const n = criterios.length;
    if (n === 0) return;
    const base = Math.floor(100 / n);
    setCriterios((prev) =>
      prev.map((c, idx) => ({ ...c, peso: idx === 0 ? 100 - base * (n - 1) : base }))
    );
  };

  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!valido || saving) return;
    onSave({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      criterios: criterios.map((c) => ({
        nombre: c.nombre.trim(),
        peso: Number(c.peso),
        esperado: c.esperado.trim(),
      })),
    });
  };

  // El modal se monta siempre (para no perder el estado del form al cerrar y reabrir),
  // asi que el `open` se aplica aqui en vez de en el <Modal> compartido.
  if (!open) return null;

  return (
    <Modal open title={rubric ? "Editar rúbrica" : "Nueva rúbrica"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="rub-nombre" className="block text-xs font-semibold text-text-1 mb-1.5">
            Nombre de la rúbrica
          </label>
          <input
            id="rub-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Ensayo académico"
            className="w-full px-3 py-2 border border-border rounded text-sm"
          />
        </div>

        <div>
          <label htmlFor="rub-desc" className="block text-xs font-semibold text-text-1 mb-1.5">
            Descripción <span className="text-text-3 font-normal">(opcional)</span>
          </label>
          <input
            id="rub-desc"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Para qué sirve esta rúbrica"
            className="w-full px-3 py-2 border border-border rounded text-sm"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-text-1">Criterios</span>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={distribuir}>
                Repartir 100
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCriterios((prev) => [...prev, criterioVacio()])}
              >
                + Criterio
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {criterios.map((c, i) => (
              <div key={i} className="border border-border rounded p-2.5 bg-surface-2">
                <div className="flex gap-2 mb-2">
                  <input
                    value={c.nombre}
                    onChange={(e) => patch(i, { nombre: e.target.value })}
                    placeholder="Nombre del criterio"
                    className="flex-1 px-2.5 py-1.5 border border-border rounded text-[13px] bg-surface"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={c.peso}
                      onChange={(e) => patch(i, { peso: Number(e.target.value) })}
                      className="w-16 px-2 py-1.5 border border-border rounded text-[13px] bg-surface"
                    />
                    <span className="text-xs text-text-3">%</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCriterios((prev) => prev.filter((_, idx) => idx !== i))}
                    disabled={criterios.length === 1}
                    aria-label={`Quitar criterio ${c.nombre || i + 1}`}
                  >
                    ✕
                  </Button>
                </div>
                <textarea
                  rows={2}
                  value={c.esperado}
                  onChange={(e) => patch(i, { esperado: e.target.value })}
                  placeholder="¿Qué tiene que aparecer en la entrega para cumplir este criterio?"
                  className="w-full px-2.5 py-1.5 border border-border rounded text-[13px] bg-surface"
                />
              </div>
            ))}
          </div>

          <div className={`mt-2 text-xs ${pesosOk ? "text-success" : "text-danger"}`}>
            Suma de pesos: {sumaPesos}% {pesosOk ? "✓" : "(debe ser 100%)"}
          </div>
        </div>

        {faltanEsperado && (
          <InfoBox variant="warning">
            Cada criterio necesita describir lo esperado. Es lo que le permite a la IA saber qué
            buscar en la entrega.
          </InfoBox>
        )}
        {error && <InfoBox variant="error">{error}</InfoBox>}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!valido || saving}>
            {saving ? "Guardando…" : rubric ? "Guardar cambios" : "Crear rúbrica"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function errorDeFormulario(e: unknown): string {
  return apiErrorMessage(e, "No se pudo guardar la rúbrica");
}
