import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTeacherCourses } from "../../hooks/useTeacherCourses";
import {
  useCourseContentTree,
  useCourseSections,
  useCreateSection,
  useDeleteSection,
  useUploadMaterialFile,
} from "../../hooks/useContent";
import { Card, CardHeader } from "../../components/ui/Card";
import { Tag, type TagColor } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import { apiErrorMessage } from "../../services/api";
import { resolverMateriaActiva } from "../../utils/materiaActiva";
import { ContentAccessCard } from "../../components/teacher/ContentAccessCard";
import { MaterialRow } from "../../components/teacher/MaterialRow";
import type { RagStatus, UploadedMaterial } from "../../types/domain";

const FILE_ICON: Record<UploadedMaterial["fileType"], string> = { pdf: "", pptx: "", docx: "", txt: "", img: "", video: "" };
const RAG_COLOR: Record<RagStatus, TagColor> = { Indexado: "green", "Indexando…": "blue", "Sin indexar": "gray" };
const RAG_LABEL: Record<RagStatus, string> = { Indexado: "RAG", "Indexando…": "RAG", "Sin indexar": "RAG" };

export function TeacherContentPage(): React.ReactElement {
  const { data: courses } = useTeacherCourses();
  const [searchParams, setSearchParams] = useSearchParams();
  // La materia puede venir en la URL (?course=...), por ejemplo desde "Mis materias".
  const [courseId, setCourseId] = useState<string | null>(searchParams.get("course"));
  // Solo se respeta si es una materia del docente: un id ajeno o viejo cae a la primera.
  const activeCourse = resolverMateriaActiva(courseId, courses);

  const { data: sections } = useCourseSections(activeCourse);
  const { data: tree, isLoading: treeLoading } = useCourseContentTree(activeCourse);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const activeSection = sectionId ?? sections?.[0]?.id ?? null;
  const activeTreeSection = (tree ?? []).find((s) => s.id === activeSection);
  const activeClass = activeTreeSection?.classes.find((c) => c.id === classId) ?? null;
  const activeSectionName = (sections ?? []).find((s) => s.id === activeSection)?.nombre ?? null;

  const uploadFile = useUploadMaterialFile();
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
        if (activeSection === id) setClassId(null);
      },
      onError: (err) => setSectionError(apiErrorMessage(err, "No se pudo eliminar la sección")),
    });
  };

  const handleUpload = (file: File): void => {
    if (!activeSection) {
      setSavedMsg("Seleccioná una materia y una unidad destino.");
      return;
    }
    setSavedMsg("");
    uploadFile.mutate(
      { sectionId: activeSection, file, classId },
      {
        onSuccess: () => setSavedMsg("Archivo guardado e indexado por el RAG Pipeline"),
        onError: (err) => {
          const msg = apiErrorMessage(err, "");
          setSavedMsg(`No se pudo subir el archivo. ${msg}`);
        },
      }
    );
  };

  const materialesDestino = activeClass ? activeClass.materials : (activeTreeSection?.materials ?? []);
  const destinoNombre = activeClass
    ? `${activeSectionName ?? "Unidad"} · ${activeClass.title}`
    : activeSectionName;

  return (
    <div>
      <div className="flex justify-between items-start gap-3.5 flex-wrap mb-6">
        <div>
          <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Contenidos y materiales</h2>
          <p className="text-[13px] text-text-2">Organizá la materia en unidades y clases. Los archivos de cada clase quedan disponibles para el Tutor IA.</p>
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
                  setClassId(null);
                  setSearchParams({ course: e.target.value }, { replace: true });
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
            <CardHeader title="Estructura de unidades y clases" />
            <p className="text-xs text-text-2 mb-3">
              Elegí si el archivo pertenece a la unidad o a una clase. Las clases se crean desde Planificación.
            </p>
            <div className="flex flex-col gap-2.5 mb-3">
              {(tree ?? []).map((s) => {
                const esUnidadDestino = activeSection === s.id && !activeClass;
                return (
                  <div key={s.id} className="border border-border rounded overflow-hidden">
                    <div className="px-3 py-2 bg-surface-2 flex justify-between gap-2 items-center">
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-text-1 truncate">{s.nombre}</div>
                        <div className="text-[11px] text-text-3">{s.tipo === "PRACTICA" ? "Práctica" : "Teoría"}</div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant={esUnidadDestino ? "primary" : "secondary"}
                          onClick={() => {
                            setSectionId(s.id);
                            setClassId(null);
                          }}
                        >
                          Subir a la unidad
                        </Button>
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
                    </div>
                    <div className="px-3 py-2.5 flex flex-col gap-2">
                      {s.materials.length > 0 && (
                        <div className="flex flex-col gap-1">
                          <div className="text-[10px] font-semibold text-text-3 uppercase tracking-wide">Archivos de la unidad</div>
                          {s.materials.map((m) => (
                            <MaterialRow
                              key={m.id}
                              material={m}
                              icon={FILE_ICON[m.fileType]}
                              rag={{ color: RAG_COLOR[m.ragStatus], label: RAG_LABEL[m.ragStatus] }}
                            />
                          ))}
                        </div>
                      )}

                      {s.classes.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <div className="text-[10px] font-semibold text-text-3 uppercase tracking-wide">Clases</div>
                          {s.classes.map((c) => {
                            const esClaseDestino = activeSection === s.id && activeClass?.id === c.id;
                            return (
                              <div
                                key={c.id}
                                className={`rounded border px-2.5 py-2 ${
                                  esClaseDestino ? "border-primary bg-primary-light" : "border-border bg-surface"
                                }`}
                              >
                                <div className="flex justify-between gap-2 items-start">
                                  <div className="min-w-0">
                                    <div className="text-[12px] font-semibold text-text-1 truncate">{c.title}</div>
                                    <div className="text-[11px] text-text-3">
                                      {new Date(c.date).toLocaleDateString("es-AR")} ·{" "}
                                      {c.studentVisible ? "Visible para estudiantes" : "Planificada"}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={esClaseDestino ? "primary" : "secondary"}
                                    onClick={() => {
                                      setSectionId(s.id);
                                      setClassId(c.id);
                                    }}
                                  >
                                    Subir aquí
                                  </Button>
                                </div>
                                {c.materials.length > 0 && (
                                  <div className="mt-1.5 flex flex-col gap-0.5">
                                    {c.materials.map((m) => (
                                      <MaterialRow
                                        key={m.id}
                                        material={m}
                                        icon={FILE_ICON[m.fileType]}
                                        rag={{ color: RAG_COLOR[m.ragStatus], label: RAG_LABEL[m.ragStatus] }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {s.materials.length === 0 && s.classes.length === 0 && (
                        <div className="text-[11px] text-text-3">Esta unidad todavía no tiene archivos ni clases.</div>
                      )}
                    </div>
                  </div>
                );
              })}
              {!activeCourse && <p className="text-xs text-text-2">Seleccioná una materia.</p>}
              {activeCourse && treeLoading && <p className="text-xs text-text-2">Cargando estructura…</p>}
              {activeCourse && !treeLoading && (tree ?? []).length === 0 && (
                <p className="text-xs text-text-2">Esta materia todavía no tiene unidades.</p>
              )}
            </div>

            <div className="grid md:grid-cols-[1fr_auto_auto] gap-2 items-end">
              <div>
                <label htmlFor="section-name" className="block text-xs font-semibold text-text-1 mb-1.5">
                  Nueva unidad
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
                {createSection.isPending ? "Creando…" : "+ Crear unidad"}
              </Button>
            </div>
            {sectionMsg && <p className="text-xs text-success mt-2">{sectionMsg}</p>}
            {sectionError && <p className="text-xs text-danger mt-2">{sectionError}</p>}
          </Card>

          <Card>
            <CardHeader title="Subir archivo" />
            <p className="text-xs text-text-2 mb-3">
              Destino:{" "}
              {destinoNombre ? (
                <strong className="text-text-1">{destinoNombre}</strong>
              ) : (
                <span className="text-danger">elegí una unidad o clase</span>
              )}
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
            {savedMsg && <p className="text-xs text-success mt-2">{savedMsg}</p>}
          </Card>
        </div>

        <aside>
          <Card>
            <CardHeader title="Material del destino" />
            <div className="flex flex-col">
              {materialesDestino.map((f) => (
                <MaterialRow
                  key={f.id}
                  material={f}
                  icon={FILE_ICON[f.fileType]}
                  rag={{ color: RAG_COLOR[f.ragStatus], label: RAG_LABEL[f.ragStatus] }}
                />
              ))}
              {materialesDestino.length === 0 && (
                <p className="text-xs text-text-2 py-2">
                  {activeClass ? "Esta clase todavía no tiene archivos." : "Esta unidad todavía no tiene archivos propios."}
                </p>
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
