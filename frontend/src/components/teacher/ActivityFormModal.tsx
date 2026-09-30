import React, { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { InfoBox } from "../ui/InfoBox";
import { useCreateActivity, useUpdateActivity } from "../../hooks/useActivities";
import { apiErrorMessage } from "../../services/api";
import { TIPO_ACTIVIDAD_LABEL } from "../../services/activities.service";
import type { Rubric } from "../../types/domain";
import type { ContentSection } from "../../services/content.service";
import type { AssignmentOption, AssignmentType } from "../../types/domain";
import type { TeacherActivity } from "../../services/activities.service";

const TIPOS: AssignmentType[] = ["MULTIPLE_CHOICE", "DESARROLLO", "ARCHIVO", "CODIGO"];

const AYUDA: Record<AssignmentType, string> = {
  MULTIPLE_CHOICE: "El alumno elige una de las opciones que definas abajo.",
  DESARROLLO: "El alumno escribe su resolución en texto libre.",
  ARCHIVO: "El alumno adjunta un archivo. Indicá los formatos aceptados.",
  CODIGO: "El alumno pega su código en un editor de texto.",
};

const inputClass =
  "w-full px-3 py-2 border border-border rounded text-sm text-text-1 bg-surface transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,61,122,0.1)]";

const toInputDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
};

function errorDeApi(error: unknown): string {
  return apiErrorMessage(error, "Ocurrió un error");
}

export function ActivityFormModal({
  open,
  onClose,
  materiaId,
  sections,
  rubrics,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  materiaId: string | null;
  sections: ContentSection[];
  rubrics: Rubric[];
  editing: TeacherActivity | null;
}): React.ReactElement | null {
  const [seccionId, setSeccionId] = useState("");
  const [rubricaId, setRubricaId] = useState("");
  const [nombre, setNombre] = useState("");
  const [consigna, setConsigna] = useState("");
  const [tipo, setTipo] = useState<AssignmentType>("DESARROLLO");
  const [opciones, setOpciones] = useState<AssignmentOption[]>([]);
  const [formatos, setFormatos] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [correccionManual, setCorreccionManual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const crear = useCreateActivity();
  const actualizar = useUpdateActivity();

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setSeccionId(editing.seccion_id);
      setRubricaId(editing.rubrica_id ?? "");
      setNombre(editing.nombre);
      setConsigna(editing.consigna);
      setTipo(editing.tipo);
      setOpciones(editing.opciones_mc ?? []);
      setFormatos(editing.formatos_permitidos ?? "");
      setFechaLimite(toInputDate(editing.fecha_limite));
      setCorreccionManual(editing.correccion_manual);
    } else {
      setSeccionId(sections[0]?.id ?? "");
      setRubricaId("");
      setNombre("");
      setConsigna("");
      setTipo("DESARROLLO");
      setOpciones([{ texto: "", correcta: true }, { texto: "", correcta: false }]);
      setFormatos("pdf");
      const en7 = new Date(Date.now() + 7 * 864e5);
      setFechaLimite(toInputDate(en7.toISOString()));
      setCorreccionManual(false);
    }
  }, [open, editing, sections]);

  if (!open) return null;

  const guardando = crear.isPending || actualizar.isPending;

  const validar = (): string | null => {
    if (!seccionId) return "Elegí la sección donde vive la actividad";
    if (!nombre.trim()) return "Poné un nombre";
    if (!consigna.trim()) return "Escribí la consigna";
    if (!fechaLimite) return "Indicá la fecha de vencimiento";
    if (tipo === "MULTIPLE_CHOICE") {
      const validas = opciones.filter((o) => o.texto.trim());
      if (validas.length < 2) return "La opción múltiple necesita al menos 2 opciones con texto";
      if (validas.filter((o) => o.correcta).length !== 1) return "Marcá exactamente una opción como correcta";
    }
    return null;
  };

  const guardar = async (): Promise<void> => {
    const falla = validar();
    if (falla) {
      setError(falla);
      return;
    }
    setError(null);

    const payload = {
      seccion_id: seccionId,
      // Al editar tiene que ir null explícito: sin esto, vaciar el selector no
      // desvincula la rubrica y sigue dibujada en la actividad.
      rubrica_id: editing ? rubricaId || null : rubricaId || undefined,
      nombre: nombre.trim(),
      consigna: consigna.trim(),
      tipo,
      opciones_mc:
        tipo === "MULTIPLE_CHOICE"
          ? opciones.filter((o) => o.texto.trim()).map((o) => ({ texto: o.texto.trim(), correcta: o.correcta }))
          : undefined,
      formatos_permitidos: tipo === "ARCHIVO" || tipo === "CODIGO" ? formatos.trim() : undefined,
      fecha_limite: fechaLimite,
      correccion_manual: correccionManual,
    };

    try {
      if (editing) {
        await actualizar.mutateAsync({ actividadId: editing.id, input: payload });
      } else {
        await crear.mutateAsync({ materiaId: materiaId as string, input: payload });
      }
      onClose();
    } catch (e) {
      setError(errorDeApi(e));
    }
  };

  const cambiarTipo = (t: AssignmentType): void => {
    setTipo(t);
    if (t === "MULTIPLE_CHOICE" && opciones.length === 0) {
      setOpciones([
        { texto: "", correcta: true },
        { texto: "", correcta: false },
      ]);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar actividad" : "Nueva actividad"}>
      <div className="mb-3">
        <label htmlFor="act-nombre" className="block text-xs font-semibold text-text-1 mb-1.5">
          Nombre
        </label>
        <input
          id="act-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej.: TP1 - Normalización"
          className={inputClass}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="act-consigna" className="block text-xs font-semibold text-text-1 mb-1.5">
          Consigna
        </label>
        <textarea
          id="act-consigna"
          value={consigna}
          onChange={(e) => setConsigna(e.target.value)}
          rows={3}
          placeholder="Qué tiene que resolver el alumno"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label htmlFor="act-seccion" className="block text-xs font-semibold text-text-1 mb-1.5">
            Sección
          </label>
          <select
            id="act-seccion"
            value={seccionId}
            onChange={(e) => setSeccionId(e.target.value)}
            className={inputClass}
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="act-fecha" className="block text-xs font-semibold text-text-1 mb-1.5">
            Vence
          </label>
          <input
            id="act-fecha"
            type="datetime-local"
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mb-2">
        <span className="block text-xs font-semibold text-text-1 mb-1.5">Tipo de entrega</span>
        <div className="grid grid-cols-2 gap-1.5">
          {TIPOS.map((t) => (
            <label
              key={t}
              className={`flex items-center gap-2 px-2.5 py-2 border rounded cursor-pointer transition-colors ${
                tipo === t ? "border-primary bg-primary-light" : "border-border hover:bg-surface-2"
              }`}
            >
              <input
                type="radio"
                name="tipo-actividad"
                checked={tipo === t}
                onChange={() => cambiarTipo(t)}
                className="accent-primary"
              />
              <span className="text-xs font-semibold text-text-1">{TIPO_ACTIVIDAD_LABEL[t]}</span>
            </label>
          ))}
        </div>
        <p className="text-[11px] text-text-3 mt-1.5">{AYUDA[tipo]}</p>
      </div>

      {tipo === "MULTIPLE_CHOICE" && (
        <div className="mb-3">
          <span className="block text-xs font-semibold text-text-1 mb-1.5">Opciones</span>
          <div className="flex flex-col gap-1.5">
            {opciones.map((o, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="opcion-correcta"
                  checked={o.correcta}
                  onChange={() => setOpciones(opciones.map((x, j) => ({ ...x, correcta: j === i })))}
                  className="accent-primary shrink-0"
                  title="Marcar como correcta"
                />
                <input
                  value={o.texto}
                  onChange={(e) =>
                    setOpciones(opciones.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)))
                  }
                  placeholder={`Opción ${i + 1}`}
                  className={`${inputClass} py-1.5 text-xs`}
                />
                <button
                  type="button"
                  onClick={() => setOpciones(opciones.filter((_, j) => j !== i))}
                  disabled={opciones.length <= 2}
                  className="shrink-0 w-7 h-7 border border-border rounded text-text-3 hover:bg-danger-light hover:text-danger disabled:opacity-40"
                  aria-label={`Quitar opción ${i + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpciones([...opciones, { texto: "", correcta: false }])}
            className="mt-1.5 text-[11px] font-semibold text-primary hover:underline"
          >
            + Agregar opción
          </button>
        </div>
      )}

      {(tipo === "ARCHIVO" || tipo === "CODIGO") && (
        <div className="mb-3">
          <label htmlFor="act-formatos" className="block text-xs font-semibold text-text-1 mb-1.5">
            Formatos aceptados
          </label>
          <input
            id="act-formatos"
            value={formatos}
            onChange={(e) => setFormatos(e.target.value)}
            placeholder="pdf, docx, zip"
            className={`${inputClass} font-mono text-xs`}
          />
          <p className="text-[11px] text-text-3 mt-1">Separados por coma. Dejalo vacío para aceptar cualquier formato.</p>
        </div>
      )}

      <div className="mb-3">
        <label htmlFor="act-rubrica" className="block text-xs font-semibold text-text-1 mb-1.5">
          Rúbrica de corrección
        </label>
        <select
          id="act-rubrica"
          value={rubricaId}
          onChange={(e) => setRubricaId(e.target.value)}
          className={inputClass}
        >
          <option value="">Sin rúbrica (el tutor usa la genérica)</option>
          {rubrics.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.criteriaCount} criterios)
            </option>
          ))}
        </select>
        {rubrics.length === 0 && (
          <p className="text-[11px] text-text-3 mt-1">
            Todavía no hay rúbricas en esta materia.
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={correccionManual}
          onChange={(e) => setCorreccionManual(e.target.checked)}
          className="accent-primary"
        />
        <span className="text-xs text-text-1">Corregir manualmente (no pedirle sugerencia a la IA)</span>
      </label>

      {error && <InfoBox variant="error">{error}</InfoBox>}

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : editing ? "Guardar cambios" : "Crear actividad"}
        </Button>
      </div>
    </Modal>
  );
}
