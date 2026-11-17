import React, { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { InfoBox } from "../ui/InfoBox";
import { useAssignPlanningMaterial } from "../../hooks/usePlanning";
import { apiErrorMessage } from "../../services/api";
import { toDateOnly } from "../../utils/format";
import type { ClassMaterialOption } from "./ClassFormModal";

const inputClass =
  "w-full px-3 py-2 border border-border rounded text-sm text-text-1 bg-surface transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,61,122,0.1)]";

export function ClassMaterialModal({
  open,
  onClose,
  courseId,
  classDate,
  className,
  contentOptions,
  onAssigned,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string | null;
  classDate: string;
  className: string;
  contentOptions: ClassMaterialOption[];
  onAssigned?: (contentLabel: string) => void;
}): React.ReactElement | null {
  const [contentId, setContentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const asignar = useAssignPlanningMaterial();

  useEffect(() => {
    if (!open) return;
    setContentId("");
    setError(null);
  }, [open]);

  if (!open) return null;

  const guardar = async (): Promise<void> => {
    if (!courseId) {
      setError("Seleccioná una materia");
      return;
    }
    if (!toDateOnly(classDate)) {
      setError("La clase no tiene una fecha válida");
      return;
    }
    if (!contentId) {
      setError("Elegí un material de Contenidos");
      return;
    }

    setError(null);
    const label = contentOptions.find((m) => m.id === contentId)?.label ?? "Material";

    try {
      await asignar.mutateAsync({
        courseId,
        date: toDateOnly(classDate),
        contentId,
      });
      onAssigned?.(label);
      onClose();
    } catch (e) {
      setError(apiErrorMessage(e, "No se pudo asignar el material a la clase"));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Elegir de Contenidos">
      <p className="text-xs text-text-2 mb-3">
        El material se copia a <strong className="text-text-1">{className}</strong> y queda disponible para el Tutor IA.
      </p>

      <div className="mb-3">
        <label htmlFor="class-material-content" className="block text-xs font-semibold text-text-1 mb-1.5">
          Material
        </label>
        <select
          id="class-material-content"
          value={contentId}
          onChange={(e) => setContentId(e.target.value)}
          className={inputClass}
        >
          <option value="">Elegí un material</option>
          {contentOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        {contentOptions.length === 0 && (
          <p className="text-[11px] text-text-3 mt-1">
            Todavía no hay materiales subidos en esta materia.
          </p>
        )}
      </div>

      {error && <InfoBox variant="error">{error}</InfoBox>}

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={guardar} disabled={asignar.isPending || contentOptions.length === 0}>
          {asignar.isPending ? "Asignando…" : "Asignar a la clase"}
        </Button>
      </div>
    </Modal>
  );
}
