import React, { useState } from "react";
import { useTeacherCourses } from "../../hooks/useTeacherCourses";
import {
  useCourseSections,
  useCreateSection,
  useDeleteSection,
  useUploadedMaterials,
  useUploadMaterial,
  useUploadMaterialFile,
} from "../../hooks/useContent";
import { Card, CardHeader } from "../../components/ui/Card";
import { Tag, type TagColor } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import { apiErrorMessage } from "../../services/api";
import { ContentAccessCard } from "../../components/teacher/ContentAccessCard";
import type { RagStatus, UploadedMaterial } from "../../types/domain";

const FILE_ICON: Record<UploadedMaterial["fileType"], string> = { pdf: "", pptx: "", docx: "", txt: "", img: "", video: "" };
const RAG_COLOR: Record<RagStatus, TagColor> = { Indexado: "green", "Indexando…": "blue", "Sin indexar": "gray" };
const RAG_LABEL: Record<RagStatus, string> = { Indexado: "RAG", "Indexando…": "RAG", "Sin indexar": "RAG" };

export function TeacherContentPage(): React.ReactElement {
  const { data: courses } = useTeacherCourses();
  const [courseId, setCourseId] = useState<string | null>(null);
  const activeCourse = courseId ?? courses?.[0]?.id ?? null;

  const { data: sections } = useCourseSections(activeCourse);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const activeSection = sectionId ?? sections?.[0]?.id ?? null;
  const activeSectionName = (sections ?? []).find((s) => s.id === activeSection)?.nombre ?? null;

  const { data: materials, isLoading } = useUploadedMaterials(activeSection);
  const upload = useUploadMaterial();
  const uploadFile = useUploadMaterialFile();

  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceBody, setResourceBody] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const createSection = useCreateSection();
  const deleteSection = useDeleteSection();
  const [sectionName, setSectionName] = useState("");
  const [sectionTipo, setSectionTipo] = useState<"TEORIA" | "PRACTICA">("TEORIA");
  const [sectionMsg, setSectionMsg] = useState("");
  const [sectionError, setSectionError] = useState<string | null>(null);

  const handleCreateSection = (): void => {
    if (!activeCourse || !sectionName.trim()) return;
    setSectionError(null);
    setSectionMsg("");
    createSection.mutate(
      {
        courseId: activeCourse,
        input: {
          nombre: sectionName.trim(),
          tipo: sectionTipo,
          orden: (sections ?? []).length,
        },
      },
      {
        onSuccess: () => {
          setSectionMsg("Sección creada.");
          setSectionName("");
        },
        onError: (err) => setSectionError(apiErrorMessage(err, "No se pudo crear la sección")),
      }
    );
  };

  const handleDeleteSection = (id: string): void => {
    setSectionError(null);
    setSectionMsg("");
    deleteSection.mutate(id, {
      onSuccess: () => {
        setSectionMsg("Sección eliminada.");
        if (sectionId === id) setSectionId(null);
      },
      onError: (err) => setSectionError(apiErrorMessage(err, "No se pudo eliminar la sección")),
    });
  };

  const handleUpload = (file: File): void => {
    if (!activeSection) {
      setSavedMsg("Seleccioná una materia y una sección destino.");
      return;
    }
    setSavedMsg("");
    uploadFile.mutate(
      { sectionId: activeSection, file },
      {
        onSuccess: () => setSavedMsg("✅ Archivo guardado e indexado por el RAG Pipeline"),
        onError: (err) => {
          const msg = apiErrorMessage(err, "");
          setSavedMsg(`No se pudo subir el archivo. ${msg}`);
        },
      }
    );
  };

  const handleSaveText = (): void => {
    if (!resourceTitle.trim() || !activeSection) return;
    upload.mutate(
      { sectionId: activeSection, title: resourceTitle, body: resourceBody },
      {
        onSuccess: () => {
          setSavedMsg("Texto guardado e indexado por el RAG Pipeline");
          setResourceTitle("");
          setResourceBody("");
        },
        onError: () => setSavedMsg("⚠️ Ocurrió un error al guardar. Intentá de nuevo."),
      }
    );
  };

  return (
    <div>
      <div className="flex justify-between items-start gap-3.5 flex-wrap mb-6">
        <div>
          <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Contenidos y materiales</h2>
          <p className="text-[13px] text-text-2">Subí material a las secciones — el RAG Pipeline lo indexa automáticamente para el Tutor IA</p>
        </div>
        <Tag color="green">RAG Pipeline activo</Tag>
      </div>

      <div className="grid xl:grid-cols-[2fr_1fr] gap-5">
        <div className="flex flex-col gap-4.5">
          <Card>
            <CardHeader title="Seleccionar materia" />
            <div>
              <label htmlFor="content-course" className="block text-xs font-semibold text-text-1 mb-1.5">
                Materia
              </label>
              <select
                id="content-course"
                value={activeCourse ?? ""}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  setSectionId(null);
                }}
                className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
              >
                {(courses ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} — {c.curso}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          <Card>
            <CardHeader title="Secciones de la materia" />
            <p className="text-xs text-text-2 mb-3">
              Creá las secciones (unidades) de la materia y elegí el destino de subida haciendo clic en una.
            </p>
            <div className="flex flex-col gap-2 mb-3">
              {(sections ?? []).map((s) => {
                const esDestino = activeSection === s.id;
                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSectionId(s.id)}
                      className={`flex-1 min-w-0 flex items-center gap-2 py-1.5 px-2.5 rounded border text-left transition-colors ${
                        esDestino ? "border-primary bg-primary-light" : "border-border bg-surface hover:border-primary"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-text-1 truncate">{s.nombre}</div>
                        <div className="text-[11px] text-text-3">{s.tipo === "PRACTICA" ? "Práctica" : "Teoría"}</div>
                      </div>
                      {esDestino && <span className="text-[10px] font-bold text-primary uppercase">Destino</span>}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deleteSection.isPending}
                      onClick={() => handleDeleteSection(s.id)}
                      aria-label={`Eliminar sección ${s.nombre}`}
                    >
                      Eliminar
                    </Button>
                  </div>
                );
              })}
              {!activeCourse && <p className="text-xs text-text-2">Seleccioná una materia.</p>}
              {activeCourse && (sections ?? []).length === 0 && (
                <p className="text-xs text-text-2">Esta materia todavía no tiene secciones.</p>
              )}
            </div>
            <div className="grid md:grid-cols-[1fr_auto_auto] gap-2 items-end">
              <div>
                <label htmlFor="section-name" className="block text-xs font-semibold text-text-1 mb-1.5">
                  Nueva sección
                </label>
                <input
                  id="section-name"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  placeholder="Ej.: Unidad 1 — Introducción"
                  className="w-full px-3 py-2 border border-border rounded text-sm"
                />
              </div>
              <div>
                <label htmlFor="section-tipo" className="block text-xs font-semibold text-text-1 mb-1.5">
                  Tipo
                </label>
                <select
                  id="section-tipo"
                  value={sectionTipo}
                  onChange={(e) => setSectionTipo(e.target.value as "TEORIA" | "PRACTICA")}
                  className="px-3 py-2 border border-border rounded text-sm bg-surface"
                >
                  <option value="TEORIA">Teoría</option>
                  <option value="PRACTICA">Práctica</option>
                </select>
              </div>
              <Button
                onClick={handleCreateSection}
                disabled={!activeCourse || !sectionName.trim() || createSection.isPending}
              >
                {createSection.isPending ? "Creando…" : "+ Crear sección"}
              </Button>
            </div>
            {sectionMsg && <p className="text-xs text-success mt-2">{sectionMsg}</p>}
            {sectionError && <p className="text-xs text-danger mt-2">{sectionError}</p>}
          </Card>

          <Card>
            <CardHeader title="Subir archivo" />
            <p className="text-xs text-text-2 mb-3">
              Destino: {activeSectionName ? <strong className="text-text-1">{activeSectionName}</strong> : <span className="text-danger">elegí una sección</span>}
            </p>
            <label
              htmlFor="content-file-input"
              className={`block border-2 border-dashed border-border-strong rounded p-7 bg-surface-2 text-center ${
                activeSection ? "cursor-pointer" : "opacity-50"
              }`}
            >
              <div className="text-2xl mb-2"></div>
              <div className="font-semibold text-text-1 mb-1">Hacé click o arrastrá un archivo aquí</div>
              <div className="text-xs text-text-3">PDF, PPTX, DOCX, JPG, PNG, TXT · Máx. 50 MB</div>
              <input
                id="content-file-input"
                type="file"
                className="hidden"
                multiple={false}
                accept=".pdf,.pptx,.ppt,.docx,.doc,.jpg,.jpeg,.png,.gif,.webp,.svg,.txt,.md,.mp4,.mov,.webm"
                disabled={uploadFile.isPending || !activeSection}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
            {uploadFile.isPending && <p className="text-xs text-text-2 mt-2">Subiendo e indexando…</p>}
          </Card>

          <Card>
            <CardHeader title="Agregar texto o consigna" />
            <div className="mb-3.5">
              <label htmlFor="resource-title" className="block text-xs font-semibold text-text-1 mb-1.5">
                Título del recurso
              </label>
              <input
                id="resource-title"
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                placeholder="Ej.: Consigna TP3 — Herencia"
                className="w-full px-3 py-2 border border-border rounded text-sm"
              />
            </div>
            <div className="mb-3.5">
              <label htmlFor="resource-body" className="block text-xs font-semibold text-text-1 mb-1.5">
                Contenido
              </label>
              <textarea
                id="resource-body"
                rows={6}
                value={resourceBody}
                onChange={(e) => setResourceBody(e.target.value)}
                placeholder="Escribí el texto, consigna o explicación. Será indexado por el RAG Pipeline y estará disponible para el Tutor IA."
                className="w-full px-3 py-2 border border-border rounded text-sm"
              />
            </div>
            <Button onClick={handleSaveText} disabled={!resourceTitle.trim() || !activeSection || upload.isPending}>
              {upload.isPending ? "Guardando…" : "Guardar y publicar"}
            </Button>
            {savedMsg && <p className="text-xs text-success mt-2">{savedMsg}</p>}
          </Card>
        </div>

        <aside>
          <Card>
            <CardHeader title="Material cargado" />
            {isLoading && <p className="text-sm text-text-2">Cargando…</p>}
            <div className="flex flex-col">
              {(materials ?? []).map((f) => (
                <div key={f.name} className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-sm bg-surface-2 flex items-center justify-center text-sm shrink-0">{FILE_ICON[f.fileType]}</div>
                  <div className="flex-1 min-w-0">
                    {f.url ? (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-text-1 truncate block hover:text-primary hover:underline"
                      >
                        {f.name}
                      </a>
                    ) : (
                      <div className="text-xs font-semibold text-text-1 truncate">{f.name}</div>
                    )}
                    <div className="text-[11px] text-text-3">
                      {f.sizeLabel} · {f.date}
                    </div>
                  </div>
                  <Tag color={RAG_COLOR[f.ragStatus]}>{RAG_LABEL[f.ragStatus]}</Tag>
                </div>
              ))}
              {!isLoading && (materials ?? []).length === 0 && (
                <p className="text-xs text-text-2 py-2">Aún no hay material en esta sección.</p>
              )}
            </div>
            <p className="text-[11px] text-text-2 mt-3.5 bg-info-light border border-blue-200 rounded px-3 py-2">
              Los archivos marcados como <strong>RAG</strong> ya están disponibles para el Tutor IA de la materia.
            </p>
          </Card>

          <ContentAccessCard materiaId={activeCourse} />
        </aside>
      </div>
    </div>
  );
}