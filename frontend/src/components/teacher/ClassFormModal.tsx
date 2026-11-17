import React, { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { InfoBox } from "../ui/InfoBox";
import {
  useAssignPlanningMaterial,
  useSavePlanning,
  useUploadPlanningMaterial,
} from "../../hooks/usePlanning";
import { apiErrorMessage } from "../../services/api";
import { toDateOnly } from "../../utils/format";
import type { ContentClass, ContentSection } from "../../services/content.service";

const inputClass =
  "w-full px-3 py-2 border border-border rounded text-sm text-text-1 bg-surface transition-all focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,61,122,0.1)]";

const ACCEPT =
  ".pdf,.pptx,.ppt,.docx,.doc,.jpg,.jpeg,.png,.gif,.webp,.svg,.txt,.md,.mp4,.mov,.webm";

export interface ClassMaterialOption {
  id: string;
  label: string;
}

export interface CreatedClassInfo {
  sectionId: string;
  date: string;
  title: string;
  materialMode: "none" | "existing" | "upload";
}

export function ClassFormModal({
  open,
  onClose,
  courseId,
  sections,
  initialSectionId,
  existingClasses,
  contentOptions,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string | null;
  sections: ContentSection[];
  initialSectionId?: string | null;
  existingClasses: ContentClass[];
  contentOptions: ClassMaterialOption[];
  onCreated?: (info: CreatedClassInfo) => void;
}): React.ReactElement | null {
  const [seccionId, setSeccionId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState("");
  const [visible, setVisible] = useState(false);
  const [materialMode, setMaterialMode] = useState<"none" | "existing" | "upload">("none");
  const [contentId, setContentId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const guardarClase = useSavePlanning();
  const asignarMaterial = useAssignPlanningMaterial();
  const subirMaterial = useUploadPlanningMaterial();
  const firstSectionId = sections[0]?.id ?? "";

  useEffect(() => {
    if (!open) return;
    setSeccionId(initialSectionId ?? firstSectionId);
    setTitulo("");
    setFecha("");
    setVisible(false);
    setMaterialMode("none");
    setContentId("");
    setFile(null);
    setError(null);
  }, [open, initialSectionId, firstSectionId]);

  if (!open) return null;

  const guardando =
    guardarClase.isPending || asignarMaterial.isPending || subirMaterial.isPending;

  const validar = (): string | null => {
    if (!courseId) return "Seleccioná una materia";
    if (!seccionId) return "Elegí la unidad donde va la clase";
    if (titulo.trim().length < 2) return "Poné un título de al menos 2 caracteres";
    if (!toDateOnly(fecha)) return "Indicá la fecha de la clase";
    const fechaElegida = toDateOnly(fecha);
    const repetida = existingClasses.some((c) => toDateOnly(c.date) === fechaElegida);
    if (repetida) return "Ya hay una clase en esa fecha en esta materia. Elegí otra fecha.";
    if (materialMode === "existing" && !contentId) return "Elegí el material de Contenidos";
    if (materialMode === "upload" && !file) return "Elegí el archivo a subir";
    return null;
  };

  const guardar = async (): Promise<void> => {
    const falla = validar();
    if (falla) {
      setError(falla);
      return;
    }
    setError(null);

    const date = toDateOnly(fecha);
    const title = titulo.trim();
    let claseCreada = false;

    try {
      await guardarClase.mutateAsync({
        courseId: courseId as string,
        date,
        title,
        material: "",
        studentVisible: visible,
        sectionId: seccionId,
      });
      claseCreada = true;

      if (materialMode === "existing") {
        await asignarMaterial.mutateAsync({
          courseId: courseId as string,
          date,
          contentId,
        });
      }

      if (materialMode === "upload" && file) {
        await subirMaterial.mutateAsync({
          courseId: courseId as string,
          date,
          file,
        });
      }

      onCreated?.({ sectionId: seccionId, date, title, materialMode });
      onClose();
    } catch (e) {
      setError(
        apiErrorMessage(
          e,
          claseCreada
            ? "La clase se creó, pero no se pudo asociar el material"
            : "No se pudo crear la clase"
        )
      );
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nueva clase">
      <div className="mb-3">
        <label htmlFor="class-seccion" className="block text-xs font-semibold text-text-1 mb-1.5">
          Unidad
        </label>
        <select
          id="class-seccion"
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

      <div className="mb-3">
        <label htmlFor="class-titulo" className="block text-xs font-semibold text-text-1 mb-1.5">
          Título
        </label>
        <input
          id="class-titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej.: Clase 1 — Introducción"
          className={inputClass}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="class-fecha" className="block text-xs font-semibold text-text-1 mb-1.5">
          Fecha
        </label>
        <input
          id="class-fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
          className="accent-primary"
        />
        <span className="text-xs text-text-1">Visible para estudiantes</span>
      </label>

      <div className="mb-3">
        <span className="block text-xs font-semibold text-text-1 mb-1.5">Material de la clase</span>
        <div className="grid grid-cols-3 gap-1.5">
          <label
            className={`flex items-center gap-1.5 px-2 py-2 border rounded cursor-pointer transition-colors ${
              materialMode === "none" ? "border-primary bg-primary-light" : "border-border hover:bg-surface-2"
            }`}
          >
            <input
              type="radio"
              name="class-material"
              checked={materialMode === "none"}
              onChange={() => setMaterialMode("none")}
              className="accent-primary"
            />
            <span className="text-[11px] font-semibold text-text-1">Sin material</span>
          </label>
          <label
            className={`flex items-center gap-1.5 px-2 py-2 border rounded cursor-pointer transition-colors ${
              materialMode === "existing" ? "border-primary bg-primary-light" : "border-border hover:bg-surface-2"
            }`}
          >
            <input
              type="radio"
              name="class-material"
              checked={materialMode === "existing"}
              onChange={() => setMaterialMode("existing")}
              className="accent-primary"
            />
            <span className="text-[11px] font-semibold text-text-1">De Contenidos</span>
          </label>
          <label
            className={`flex items-center gap-1.5 px-2 py-2 border rounded cursor-pointer transition-colors ${
              materialMode === "upload" ? "border-primary bg-primary-light" : "border-border hover:bg-surface-2"
            }`}
          >
            <input
              type="radio"
              name="class-material"
              checked={materialMode === "upload"}
              onChange={() => setMaterialMode("upload")}
              className="accent-primary"
            />
            <span className="text-[11px] font-semibold text-text-1">Subir archivo</span>
          </label>
        </div>
      </div>

      {materialMode === "existing" && (
        <div className="mb-3">
          <label htmlFor="class-content" className="block text-xs font-semibold text-text-1 mb-1.5">
            Material existente
          </label>
          <select
            id="class-content"
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
      )}

      {materialMode === "upload" && (
        <div className="mb-3">
          <label htmlFor="class-file" className="block text-xs font-semibold text-text-1 mb-1.5">
            Archivo
          </label>
          <input
            id="class-file"
            type="file"
            accept={ACCEPT}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-text-2 file:mr-2 file:rounded file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-text-1"
          />
        </div>
      )}

      {error && <InfoBox variant="error">{error}</InfoBox>}

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Crear clase"}
        </Button>
      </div>
    </Modal>
  );
}
