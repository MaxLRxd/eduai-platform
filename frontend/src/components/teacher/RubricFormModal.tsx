import React, { useState } from "react";
import { Button } from "../ui/Button";
import { InfoBox } from "../ui/InfoBox";
import { Modal } from "../ui/Modal";
import { apiErrorMessage } from "../../services/api";
import type { RubricInput } from "../../services/corrections.service";
import type { Rubric } from "../../types/domain";
import { MAX_NIVELES, MIN_NIVELES, NIVELES_TIPICOS, validarNiveles, type NivelRubrica } from "../../utils/nivelesRubrica";

/**
 * Un criterio en el formulario. `descriptores` va en el mismo orden que los niveles (un texto por nivel),
 * así renombrar un nivel no pierde lo que ya se escribió; al guardar se convierte a "nombre del nivel → texto".
 */
interface Criterio {
  nombre: string;
  peso: number;
  esperado: string;
  descriptores: string[];
}

const criterioVacio = (cantidadNiveles: number): Criterio => ({
  nombre: "",
  peso: 0,
  esperado: "",
  descriptores: Array(cantidadNiveles).fill(""),
});

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
 * Los niveles de desempeño (Excelente, Bueno...) son opcionales: con ellos la IA elige un nivel por
 * criterio y la nota se calcula con esos niveles.
 */
export function RubricFormModal({ open, rubric, onClose, onSave, saving, error }: Props): React.ReactElement | null {
  const nivelesIniciales: NivelRubrica[] = rubric?.levels.length
    ? rubric.levels.map((l) => ({ nombre: l.name, puntaje: l.score }))
    : NIVELES_TIPICOS.map((n) => ({ ...n }));

  const [nombre, setNombre] = useState(rubric?.name ?? "");
  const [descripcion, setDescripcion] = useState(rubric?.description ?? "");
  const [usarNiveles, setUsarNiveles] = useState((rubric?.levels.length ?? 0) > 0);
  const [niveles, setNiveles] = useState<NivelRubrica[]>(nivelesIniciales);
  const [criterios, setCriterios] = useState<Criterio[]>(
    rubric?.criterios.length
      ? rubric.criterios.map((c) => ({
          nombre: c.name,
          peso: Number.parseFloat(c.weight) || 0,
          esperado: c.expected,
          descriptores: nivelesIniciales.map((n) => c.descriptors[n.nombre] ?? ""),
        }))
      : [criterioVacio(nivelesIniciales.length)]
  );

  const sumaPesos = criterios.reduce((total, c) => total + (Number.isFinite(c.peso) ? c.peso : 0), 0);
  const pesosOk = Math.abs(sumaPesos - 100) < 0.01;
  const faltanEsperado = criterios.some((c) => !c.esperado.trim());
  const faltanNombre = criterios.some((c) => !c.nombre.trim());
  const problemasNiveles = usarNiveles ? validarNiveles(niveles) : [];
  const valido =
    nombre.trim() && criterios.length > 0 && pesosOk && !faltanEsperado && !faltanNombre && problemasNiveles.length === 0;

  const patch = (i: number, cambio: Partial<Criterio>): void => {
    setCriterios((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...cambio } : c)));
  };

  const patchDescriptor = (criterioIdx: number, nivelIdx: number, texto: string): void => {
    setCriterios((prev) =>
      prev.map((c, idx) =>
        idx === criterioIdx ? { ...c, descriptores: c.descriptores.map((d, k) => (k === nivelIdx ? texto : d)) } : c
      )
    );
  };

  const patchNivel = (i: number, cambio: Partial<NivelRubrica>): void => {
    setNiveles((prev) => prev.map((n, idx) => (idx === i ? { ...n, ...cambio } : n)));
  };

  const agregarNivel = (): void => {
    setNiveles((prev) => {
      // Un puntaje sugerido que respete el orden: la mitad del último (nunca menor a 0).
      const ultimo = prev.at(-1)?.puntaje ?? 100;
      return [...prev, { nombre: "", puntaje: Math.max(0, Math.floor(ultimo / 2)) }];
    });
    setCriterios((prev) => prev.map((c) => ({ ...c, descriptores: [...c.descriptores, ""] })));
  };

  const quitarNivel = (i: number): void => {
    setNiveles((prev) => prev.filter((_, idx) => idx !== i));
    setCriterios((prev) => prev.map((c) => ({ ...c, descriptores: c.descriptores.filter((_, k) => k !== i) })));
  };

  const usarTipicos = (): void => {
    setNiveles(NIVELES_TIPICOS.map((n) => ({ ...n })));
    setCriterios((prev) => prev.map((c) => ({ ...c, descriptores: Array(NIVELES_TIPICOS.length).fill("") })));
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

    const nivelesLimpios = niveles.map((n) => ({ nombre: n.nombre.trim(), puntaje: Number(n.puntaje) }));

    onSave({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      criterios: criterios.map((c) => {
        const descriptores = usarNiveles
          ? Object.fromEntries(
              nivelesLimpios
                .map((n, k) => [n.nombre, (c.descriptores[k] ?? "").trim()] as const)
                .filter(([, texto]) => texto)
            )
          : {};
        return {
          nombre: c.nombre.trim(),
          peso: Number(c.peso),
          esperado: c.esperado.trim(),
          ...(Object.keys(descriptores).length > 0 ? { descriptores } : {}),
        };
      }),
      // Al editar, desactivar los niveles de una rúbrica que los tenía los quita (null); si nunca los tuvo, no se manda nada.
      niveles: usarNiveles ? nivelesLimpios : rubric?.levels.length ? null : undefined,
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
                onClick={() => setCriterios((prev) => [...prev, criterioVacio(niveles.length)])}
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
                    aria-label={`Nombre del criterio ${i + 1}`}
                    className="flex-1 px-2.5 py-1.5 border border-border rounded text-[13px] bg-surface"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={c.peso}
                      aria-label={`Peso del criterio ${i + 1}`}
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
                  aria-label={`Lo esperado del criterio ${i + 1}`}
                  onChange={(e) => patch(i, { esperado: e.target.value })}
                  placeholder="¿Qué tiene que aparecer en la entrega para cumplir este criterio?"
                  className="w-full px-2.5 py-1.5 border border-border rounded text-[13px] bg-surface"
                />

                {usarNiveles && (
                  <details className="mt-2">
                    <summary className="text-[11px] font-semibold text-primary cursor-pointer">
                      Descriptores por nivel (opcional)
                    </summary>
                    <div className="flex flex-col gap-1.5 mt-2">
                      {niveles.map((n, k) => (
                        <div key={k} className="flex items-start gap-2">
                          <span className="w-24 shrink-0 pt-1.5 text-[11px] text-text-2 truncate" title={n.nombre}>
                            {n.nombre.trim() || `Nivel ${k + 1}`}
                          </span>
                          <input
                            value={c.descriptores[k] ?? ""}
                            maxLength={500}
                            aria-label={`Descriptor de ${c.nombre || `criterio ${i + 1}`} para ${n.nombre.trim() || `nivel ${k + 1}`}`}
                            onChange={(e) => patchDescriptor(i, k, e.target.value)}
                            placeholder="¿Qué se ve en la entrega en este nivel?"
                            className="flex-1 px-2.5 py-1.5 border border-border rounded text-[12px] bg-surface"
                          />
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>

          <div className={`mt-2 text-xs ${pesosOk ? "text-success" : "text-danger"}`}>
            Suma de pesos: {sumaPesos}% {pesosOk ? "✓" : "(debe ser 100%)"}
          </div>
        </div>

        <div className="border border-border rounded p-3">
          <label className="flex items-start gap-2 text-xs font-semibold text-text-1 cursor-pointer">
            <input
              type="checkbox"
              checked={usarNiveles}
              onChange={(e) => setUsarNiveles(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Usar niveles de desempeño
              <span className="block font-normal text-text-3 mt-0.5">
                Por ejemplo Excelente, Bueno, Regular. La IA elige un nivel por criterio y la nota se calcula con esos
                niveles, no con una cuenta del modelo.
              </span>
            </span>
          </label>

          {usarNiveles && (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-text-1">
                  Niveles, de mejor a peor ({MIN_NIVELES} a {MAX_NIVELES})
                </span>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={usarTipicos}>
                    Niveles típicos
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={agregarNivel} disabled={niveles.length >= MAX_NIVELES}>
                    + Nivel
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {niveles.map((n, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={n.nombre}
                      maxLength={40}
                      onChange={(e) => patchNivel(i, { nombre: e.target.value })}
                      placeholder="Nombre del nivel"
                      aria-label={`Nombre del nivel ${i + 1}`}
                      className="flex-1 px-2.5 py-1.5 border border-border rounded text-[13px] bg-surface"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={n.puntaje}
                      onChange={(e) => patchNivel(i, { puntaje: Number(e.target.value) })}
                      aria-label={`Porcentaje del nivel ${i + 1}`}
                      className="w-16 px-2 py-1.5 border border-border rounded text-[13px] bg-surface"
                    />
                    <span className="text-xs text-text-3">%</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => quitarNivel(i)}
                      disabled={niveles.length <= MIN_NIVELES}
                      aria-label={`Quitar el nivel ${n.nombre || i + 1}`}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-text-3 mt-2">
                El porcentaje es lo que se obtiene del peso del criterio en ese nivel. El primero vale 100% y cada
                nivel baja respecto del anterior.
              </p>
              {problemasNiveles.length > 0 && (
                <ul role="alert" className="mt-2 text-xs text-danger list-disc pl-4">
                  {problemasNiveles.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
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
