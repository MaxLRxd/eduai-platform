import React, { useEffect, useState } from "react";
import { useTeacherCourses } from "../../hooks/useTeacherCourses";
import {
  useDeletePlanningMaterial,
  usePlanning,
  useSavePlanning,
  useUploadPlanningMaterial,
} from "../../hooks/usePlanning";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { apiErrorMessage } from "../../services/api";

function shortDate(iso: string): string {
  const f = new Date(iso);
  return Number.isNaN(f.getTime()) ? iso : f.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export function TeacherPlanningPage(): React.ReactElement {
  const { data: courses } = useTeacherCourses();
  const [courseId, setCourseId] = useState<string | null>(null);
  const activeCourse = courseId ?? courses?.[0]?.id ?? null;
  const activeName = courses?.find((c) => c.id === activeCourse)?.label ?? "la materia seleccionada";

  const { data: planning, isLoading } = usePlanning(activeCourse, activeName);
  const save = useSavePlanning();
  const uploadMaterial = useUploadPlanningMaterial();
  const deleteMaterial = useDeletePlanningMaterial();

  const [classIndex, setClassIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [visible, setVisible] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [draftDate, setDraftDate] = useState<string | null>(null);
  const [materialMsg, setMaterialMsg] = useState("");
  const [materialError, setMaterialError] = useState<string | null>(null);

  const current = planning?.[classIndex];
  const editingDate = draftDate ?? current?.date ?? null;
  const editingItem = (planning ?? []).find((p) => p.date === editingDate) ?? null;
  const adjunto = editingItem?.attachments?.[0] ?? null;

  useEffect(() => {
    if (current) {
      setTitle(current.title);
      setVisible(current.studentVisible);
    }
  }, [current]);

  const handleCourseChange = (id: string): void => {
    setCourseId(id);
    setClassIndex(0);
    setDraftDate(null);
    setMaterialMsg("");
    setMaterialError(null);
  };

  const startNewClass = (): void => {
    if (!newDate) return;
    setDraftDate(newDate);
    setTitle("");
    setVisible(false);
    setMaterialMsg("");
    setMaterialError(null);
    save.reset();
  };

  const handleSave = (): void => {
    if (!activeCourse || !editingDate) return;
    save.mutate(
      {
        courseId: activeCourse,
        date: editingDate,
        title,
        material: editingItem?.material ?? "",
        studentVisible: visible,
      },
      { onSuccess: () => setDraftDate(null) }
    );
  };

  const handleUploadMaterial = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!activeCourse || !editingDate) {
      setMaterialError("Primero elegí o creá una clase.");
      return;
    }
    setMaterialMsg("");
    setMaterialError(null);
    uploadMaterial.mutate(
      { courseId: activeCourse, date: editingDate, file },
      {
        onSuccess: () => setMaterialMsg("✅ Material cargado."),
        onError: (err) => setMaterialError(apiErrorMessage(err, "No se pudo subir el material")),
      }
    );
  };

  const handleDeleteMaterial = (): void => {
    if (!activeCourse || !editingDate) return;
    setMaterialMsg("");
    setMaterialError(null);
    deleteMaterial.mutate(
      { courseId: activeCourse, date: editingDate },
      {
        onSuccess: () => setMaterialMsg("🗑️ Material eliminado."),
        onError: (err) => setMaterialError(apiErrorMessage(err, "No se pudo eliminar el material")),
      }
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Planificación</h2>
        <p className="text-[13px] text-text-2">Organizá tus clases por curso. El material puede quedar visible para los alumnos.</p>
      </div>

      {isLoading && <p className="text-sm text-text-2">Cargando planificación…</p>}

      <div className="grid xl:grid-cols-[2fr_1fr] gap-5">
        <Card>
          <CardHeader title="Materia / Curso" />
          <div className="mb-4">
            <label htmlFor="planning-course" className="block text-xs font-semibold text-text-1 mb-1.5">
              Seleccioná la materia y curso
            </label>
            <select
              id="planning-course"
              value={activeCourse ?? ""}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
            >
              {(courses ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} — {c.curso}
                </option>
              ))}
            </select>
          </div>

          <CardHeader title="Clases del curso" />
          {(planning ?? []).length > 0 ? (
            <div className="flex gap-2 mb-4 flex-wrap">
              {(planning ?? []).map((p, idx) => (
                <button
                  key={p.date}
                  onClick={() => {
                    setClassIndex(idx);
                    setDraftDate(null);
                    setMaterialMsg("");
                    setMaterialError(null);
                  }}
                  className={`flex-1 min-w-[110px] flex flex-col items-center gap-0.5 py-3 px-1.5 rounded text-center transition-colors ${
                    classIndex === idx && !draftDate ? "bg-primary text-white" : "bg-surface border border-border text-text-1"
                  }`}
                >
                  <span className="text-sm font-extrabold">{shortDate(p.date)}</span>
                  <span className={`text-[10px] font-semibold ${classIndex === idx && !draftDate ? "text-white/70" : "text-text-3"}`}>
                    {p.title ? `${p.title.slice(0, 16)}${p.title.length > 16 ? "…" : ""}` : "Sin cargar"}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            !isLoading && <p className="text-xs text-text-2 mb-4">No hay clases planificadas para esta materia.</p>
          )}

          <div className="flex gap-2 items-end mb-4 mt-2">
            <div className="flex-1">
              <label htmlFor="planning-new-date" className="block text-xs font-semibold text-text-1 mb-1.5">
                Agregar clase por fecha
              </label>
              <input
                id="planning-new-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded text-sm bg-surface-2"
              />
            </div>
            <Button variant="secondary" onClick={startNewClass} disabled={!newDate || !activeCourse}>
              + Agregar clase
            </Button>
          </div>

          <div className="mb-2.5 px-3 py-2 bg-primary-light rounded text-xs font-semibold text-primary">
            📌 {draftDate ? "Nueva clase" : "Editando"}: {editingDate ? shortDate(editingDate) : "—"}
          </div>

          <div className="mb-3.5">
            <label htmlFor="planning-title" className="block text-xs font-semibold text-text-1 mb-1.5">
              Título de la clase
            </label>
            <input
              id="planning-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej.: Clases y objetos"
              className="w-full px-3 py-2 border border-border rounded text-sm"
            />
          </div>

          <div className="mb-3.5">
            <span className="block text-xs font-semibold text-text-1 mb-1.5">Material para estudiantes</span>
            <p className="text-[11px] text-text-2 mb-2">
              Subí un archivo (PDF, PPTX, DOCX, etc.) que los alumnos podrán ver con esta clase.
            </p>
            {adjunto ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-border rounded bg-surface-2">
                <span className="text-lg">📎</span>
                <div className="flex-1 min-w-0">
                  {adjunto.url ? (
                    <a href={adjunto.url} target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-primary truncate block hover:underline">
                      {adjunto.name}
                    </a>
                  ) : (
                    <span className="text-[13px] font-semibold text-text-1 truncate block">{adjunto.name}</span>
                  )}
                  {adjunto.sizeLabel && <span className="text-[11px] text-text-3">{adjunto.sizeLabel}</span>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deleteMaterial.isPending}
                  onClick={handleDeleteMaterial}
                  aria-label="Eliminar material"
                >
                  🗑️
                </Button>
              </div>
            ) : (
              <label
                htmlFor="planning-material-file"
                className={`w-full px-3 py-6 border-2 border-dashed border-border-strong rounded flex flex-col items-center justify-center text-center gap-1 ${
                  !activeCourse || !editingDate ? "opacity-50" : "cursor-pointer hover:border-primary hover:bg-primary-light"
                }`}
              >
                <span className="text-2xl">📎</span>
                <span className="text-[13px] font-semibold text-text-1">
                  {uploadMaterial.isPending ? "Subiendo…" : "Cargar archivo"}
                </span>
                <span className="text-[11px] text-text-3">o arrastralo y soltalo acá</span>
              </label>
            )}
            <input
              id="planning-material-file"
              type="file"
              className="hidden"
              onChange={handleUploadMaterial}
              disabled={!activeCourse || !editingDate || uploadMaterial.isPending}
            />
            {materialMsg && <p className="text-xs text-success mt-2">{materialMsg}</p>}
            {materialError && <p className="text-xs text-danger mt-2">{materialError}</p>}
          </div>

          <label className="bg-info-light border border-blue-200 rounded px-3 py-2.5 text-xs text-blue-900 flex items-center gap-2 cursor-pointer mb-3.5">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} /> Visible para alumnos
          </label>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleSave} disabled={save.isPending || !editingDate || title.trim().length < 2}>
              {save.isPending ? "Guardando…" : "Guardar planificación"}
            </Button>
          </div>
          {save.isSuccess && <p className="text-xs text-success mt-2">✅ Planificación guardada</p>}
        </Card>

        <Card>
          <CardHeader title="Vista para alumnos" />
          <div className="p-3.5 border border-border rounded bg-surface-2 text-[13px] text-text-2">
            {visible ? (
              <>
                <div className="font-semibold text-text-1 mb-1">{title || "Sin título"}</div>
                {editingItem?.material && <div className="mb-2">{editingItem.material}</div>}
                {adjunto ? (
                  <div className="flex items-center gap-2 mt-1 text-text-1">
                    <span>📎</span>
                    {adjunto.url ? (
                      <a href={adjunto.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        {adjunto.name}
                      </a>
                    ) : (
                      <span>{adjunto.name}</span>
                    )}
                  </div>
                ) : (
                  !editingItem?.material && <div>Sin material cargado todavía.</div>
                )}
              </>
            ) : (
              "Esta clase todavía no es visible para los alumnos."
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
