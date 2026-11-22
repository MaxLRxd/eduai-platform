import React, { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTeacherCourses } from "../../hooks/useTeacherCourses";
import {
  useCourseContentTree,
  useCourseSections,
  useCreateSection,
  useDeleteMaterial,
  useDeleteSection,
  useReorderSections,
  useUpdateSection,
  useUploadMaterialFile,
} from "../../hooks/useContent";
import { Card, CardHeader } from "../../components/ui/Card";
import { Tag, type TagColor } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import { apiErrorMessage } from "../../services/api";
import { resolverMateriaActiva } from "../../utils/materiaActiva";
import { ContentAccessCard } from "../../components/teacher/ContentAccessCard";
import { ReportesMaterialCard } from "../../components/teacher/ReportesMaterialCard";
import { MaterialRow } from "../../components/teacher/MaterialRow";
import { ActivityFormModal } from "../../components/teacher/ActivityFormModal";
import { ClassFormModal } from "../../components/teacher/ClassFormModal";
import { ClassMaterialModal } from "../../components/teacher/ClassMaterialModal";
import { SeccionEditForm } from "../../components/teacher/SeccionEditForm";
import { moverUnidad } from "../../services/content.service";
import { useTeacherActivities } from "../../hooks/useActivities";
import { useRubrics } from "../../hooks/useCorrections";
import { TIPO_ACTIVIDAD_LABEL } from "../../services/activities.service";
import type { RagStatus, UploadedMaterial } from "../../types/domain";

const FILE_ICON: Record<UploadedMaterial["fileType"], string> = { pdf: "", pptx: "", docx: "", txt: "", img: "", video: "" };
const RAG_COLOR: Record<RagStatus, TagColor> = { Indexado: "green", "Indexando…": "blue", "Sin indexar": "gray" };
const RAG_LABEL: Record<RagStatus, string> = { Indexado: "RAG", "Indexando…": "RAG", "Sin indexar": "RAG" };

export function TeacherContentPage(): React.ReactElement {
  const navigate = useNavigate();
  const { data: courses } = useTeacherCourses();
  const [searchParams, setSearchParams] = useSearchParams();
  // La materia puede venir en la URL (?course=...), por ejemplo desde "Mis materias".
  const [courseId, setCourseId] = useState<string | null>(searchParams.get("course"));
  // Solo se respeta si es una materia del docente: un id ajeno o viejo cae a la primera.
  const activeCourse = resolverMateriaActiva(courseId, courses);

  const irAPlanificacion = (): void => {
    navigate(activeCourse ? `/teacher/planning?course=${activeCourse}` : "/teacher/planning");
  };

  const { data: sections } = useCourseSections(activeCourse);
  const { data: tree, isLoading: treeLoading } = useCourseContentTree(activeCourse);
  const { data: activities } = useTeacherActivities(activeCourse);
  const { data: rubrics } = useRubrics(activeCourse ?? undefined);
  const allClasses = (tree ?? []).flatMap((s) => s.classes);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const activeSection = sectionId ?? sections?.[0]?.id ?? null;
  const activeTreeSection = (tree ?? []).find((s) => s.id === activeSection);
  const activeClass = activeTreeSection?.classes.find((c) => c.id === classId) ?? null;

  const uploadFile = useUploadMaterialFile();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [savedMsg, setSavedMsg] = useState("");
  const [uploadTarget, setUploadTarget] = useState<{
    sectionId: string;
    classId: string | null;
    label: string;
  } | null>(null);

  const createSection = useCreateSection();
  const deleteSection = useDeleteSection();
  const deleteMaterial = useDeleteMaterial();
  const updateSection = useUpdateSection();
  const reorderSections = useReorderSections();
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [sectionName, setSectionName] = useState("");
  const [sectionTipo, setSectionTipo] = useState<"TEORIA" | "PRACTICA">("TEORIA");
  const [sectionFile, setSectionFile] = useState<File | null>(null);
  const sectionFileInputRef = useRef<HTMLInputElement>(null);
  const [crearClaseAlCrear, setCrearClaseAlCrear] = useState(false);
  const [sectionMsg, setSectionMsg] = useState("");
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [evalTarget, setEvalTarget] = useState<{ sectionId: string; classId: string | null } | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [classModalSectionId, setClassModalSectionId] = useState<string | null>(null);
  const [materialTarget, setMaterialTarget] = useState<{
    sectionId: string;
    classId: string;
    className: string;
    classDate: string;
  } | null>(null);

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
        onSuccess: (created) => {
          setSectionMsg("Sección creada.");
          setSectionName("");
          if (sectionFile) {
            uploadFile.mutate(
              { sectionId: created.id, file: sectionFile },
              {
                onSuccess: () => setSectionMsg("Sección creada con material indexado."),
                onError: (err) =>
                  setSectionError(
                    apiErrorMessage(err, "La sección se creó, pero no se pudo subir el material")
                  ),
              }
            );
            setSectionFile(null);
            if (sectionFileInputRef.current) sectionFileInputRef.current.value = "";
          }
          if (crearClaseAlCrear) {
            setCrearClaseAlCrear(false);
            setClassModalSectionId(created.id);
            setClassModalOpen(true);
          }
        },
        onError: (err) => setSectionError(apiErrorMessage(err, "No se pudo crear la sección")),
      }
    );
  };

  const handleMoveSection = (index: number, delta: -1 | 1): void => {
    const ids = moverUnidad((tree ?? []).map((s) => s.id), index, delta);
    if (!ids || !activeCourse) return;
    setSectionError(null);
    setSectionMsg("");
    reorderSections.mutate(
      { courseId: activeCourse, ids },
      { onError: (err) => setSectionError(apiErrorMessage(err, "No se pudo cambiar el orden")) }
    );
  };

  const handleSaveSection = (id: string, cambios: { nombre: string; tipo: "TEORIA" | "PRACTICA" }): void => {
    setEditError(null);
    updateSection.mutate(
      { sectionId: id, input: cambios },
      {
        onSuccess: () => {
          setEditingSectionId(null);
          setSectionMsg("Unidad actualizada.");
        },
        onError: (err) => setEditError(apiErrorMessage(err, "No se pudo guardar la unidad")),
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

  const beginUpload = (sectionId: string, classId: string | null, label: string): void => {
    setSavedMsg("");
    setSectionId(sectionId);
    setClassId(classId);
    setUploadTarget({ sectionId, classId, label });
    setTimeout(() => uploadInputRef.current?.click(), 0);
  };

  const openEvaluation = (sectionId: string, classId: string | null): void => {
    setEvalTarget({ sectionId, classId });
    setActivityOpen(true);
  };

  const openClassModal = (sectionId: string): void => {
    setSavedMsg("");
    setSectionError(null);
    setClassModalSectionId(sectionId);
    setClassModalOpen(true);
  };

  const openClassMaterial = (
    sectionId: string,
    classId: string,
    className: string,
    classDate: string
  ): void => {
    setSavedMsg("");
    setSectionError(null);
    setSectionId(sectionId);
    setClassId(classId);
    setMaterialTarget({ sectionId, classId, className, classDate });
  };

  const handleUpload = (file: File): void => {
    if (!uploadTarget) return;
    setSavedMsg("");
    uploadFile.mutate(
      { sectionId: uploadTarget.sectionId, file, classId: uploadTarget.classId },
      {
        onSuccess: () => setSavedMsg(`Archivo guardado en ${uploadTarget.label} e indexado por el RAG Pipeline`),
        onError: (err) => {
          const msg = apiErrorMessage(err, "");
          setSavedMsg(`No se pudo subir el archivo. ${msg}`);
        },
      }
    );
  };

  const handleDeleteMaterial = (id: string, name: string): void => {
    setSavedMsg("");
    setSectionError(null);
    deleteMaterial.mutate(id, {
      onSuccess: () => setSavedMsg(`Material "${name}" eliminado.`),
      onError: (err) => setSectionError(apiErrorMessage(err, "No se pudo eliminar el material")),
    });
  };

  const materialDeleteProps = (m: UploadedMaterial) => ({
    onDelete: m.id.startsWith("clase-") ? undefined : () => handleDeleteMaterial(m.id, m.name),
    deleting: deleteMaterial.isPending && deleteMaterial.variables === m.id,
  });

  const materialesDestino = activeClass ? activeClass.materials : (activeTreeSection?.materials ?? []);

  const contentOptions = (tree ?? []).flatMap((s) => [
    ...s.materials
      .filter((m) => Boolean(m.url))
      .map((m) => ({ id: m.id, label: `${m.name} · ${s.nombre}` })),
    ...s.classes.flatMap((c) =>
      c.materials
        .filter((m) => Boolean(m.url) && !m.id.startsWith("clase-"))
        .map((m) => ({ id: m.id, label: `${m.name} · ${c.title}` }))
    ),
  ]);

  return (
    <div>
      <div className="flex justify-between items-start gap-3.5 flex-wrap mb-6">
        <div>
          <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Contenidos y materiales</h2>
          <p className="text-[13px] text-text-2">Organizá la materia en unidades y clases. Los archivos de cada clase quedan disponibles para el Tutor IA.</p>
        </div>
        <Tag color="green">RAG Pipeline activo</Tag>
        <Button variant="secondary" onClick={irAPlanificacion}>
          Ir a Planificación
        </Button>
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
              Elegí si el archivo pertenece a la unidad o a una clase. Podés crear clases acá o desde Planificación.
            </p>
            <div className="flex flex-col gap-2.5 mb-3">
              {(tree ?? []).map((s, indice, todas) => {
                const esUnidadDestino = activeSection === s.id && !activeClass;
                const actividadesUnidad = (activities ?? []).filter(
                  (a) => a.seccion_id === s.id && !a.clase_id
                );
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
                          onClick={() => beginUpload(s.id, null, s.nombre)}
                        >
                          Subir a la unidad
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEvaluation(s.id, null)}>
                          + Evaluación
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openClassModal(s.id)}>
                          + Clase
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={indice === 0 || reorderSections.isPending}
                          onClick={() => handleMoveSection(indice, -1)}
                          aria-label={`Subir la unidad ${s.nombre}`}
                          title="Subir"
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={indice === todas.length - 1 || reorderSections.isPending}
                          onClick={() => handleMoveSection(indice, 1)}
                          aria-label={`Bajar la unidad ${s.nombre}`}
                          title="Bajar"
                        >
                          ↓
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditError(null);
                            setEditingSectionId(editingSectionId === s.id ? null : s.id);
                          }}
                          aria-label={`Editar la unidad ${s.nombre}`}
                        >
                          Editar
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
                    {editingSectionId === s.id && (
                      <SeccionEditForm
                        nombre={s.nombre}
                        tipo={s.tipo}
                        guardando={updateSection.isPending}
                        error={editError}
                        onGuardar={(cambios) => handleSaveSection(s.id, cambios)}
                        onCancelar={() => setEditingSectionId(null)}
                      />
                    )}
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
                              {...materialDeleteProps(m)}
                            />
                          ))}
                        </div>
                      )}

                      {actividadesUnidad.length > 0 && (
                        <div className="flex flex-col gap-1">
                          <div className="text-[10px] font-semibold text-text-3 uppercase tracking-wide">Evaluaciones de la unidad</div>
                          {actividadesUnidad.map((a) => (
                            <div key={a.id} className="rounded border border-border bg-surface-2 px-2 py-1.5">
                              <div className="text-[12px] font-semibold text-text-1">{a.nombre}</div>
                              <div className="text-[10px] text-text-3">
                                {TIPO_ACTIVIDAD_LABEL[a.tipo]} · vence{" "}
                                {new Date(a.fecha_limite).toLocaleDateString("es-AR")}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {s.classes.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <div className="text-[10px] font-semibold text-text-3 uppercase tracking-wide">Clases</div>
                          {s.classes.map((c) => {
                            const esClaseDestino = activeSection === s.id && activeClass?.id === c.id;
                            const actividadesClase = (activities ?? []).filter((a) => a.clase_id === c.id);
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
                                  <div className="flex flex-wrap gap-1 justify-end">
                                    <Button
                                      size="sm"
                                      variant={esClaseDestino ? "primary" : "secondary"}
                                      onClick={() => beginUpload(s.id, c.id, c.title)}
                                    >
                                      Subir aquí
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={irAPlanificacion}
                                      aria-label={`Editar la clase ${c.title}`}
                                    >
                                      Editar
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openClassMaterial(s.id, c.id, c.title, c.date)}
                                    >
                                      Elegir de Contenidos
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => openEvaluation(s.id, c.id)}>
                                      + Evaluación
                                    </Button>
                                  </div>
                                </div>
                                {c.materials.length > 0 && (
                                  <div className="mt-1.5 flex flex-col gap-0.5">
                                    {c.materials.map((m) => (
                                      <MaterialRow
                                        key={m.id}
                                        material={m}
                                        icon={FILE_ICON[m.fileType]}
                                        rag={{ color: RAG_COLOR[m.ragStatus], label: RAG_LABEL[m.ragStatus] }}
                                        {...materialDeleteProps(m)}
                                      />
                                    ))}
                                  </div>
                                )}
                                {actividadesClase.length > 0 && (
                                  <div className="mt-1.5 flex flex-col gap-0.5">
                                    {actividadesClase.map((a) => (
                                      <div key={a.id} className="rounded bg-surface-2 px-2 py-1 text-[11px] text-text-2">
                                        <span className="font-semibold text-text-1">{a.nombre}</span> ·{" "}
                                        {TIPO_ACTIVIDAD_LABEL[a.tipo]} · vence{" "}
                                        {new Date(a.fecha_limite).toLocaleDateString("es-AR")}
                                      </div>
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

            <input
              ref={uploadInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.pptx,.ppt,.docx,.doc,.jpg,.jpeg,.png,.gif,.webp,.svg,.txt,.md,.mp4,.mov,.webm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
            {uploadFile.isPending && <p className="text-xs text-text-2 mb-3">Subiendo e indexando…</p>}
            {savedMsg && <p className="text-xs text-success mb-3">{savedMsg}</p>}

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
            <div className="mt-2">
              <label htmlFor="section-file" className="block text-xs font-semibold text-text-1 mb-1.5">
                Material inicial de la unidad (opcional)
              </label>
              <input
                id="section-file"
                ref={sectionFileInputRef}
                type="file"
                accept=".pdf,.pptx,.ppt,.docx,.doc,.jpg,.jpeg,.png,.gif,.webp,.svg,.txt,.md,.mp4,.mov,.webm"
                onChange={(e) => setSectionFile(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-text-2 file:mr-2 file:rounded file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-text-1"
              />
              <p className="text-[11px] text-text-3 mt-1">
                Se sube y se indexa junto con la creación de la unidad.
              </p>
            </div>
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={crearClaseAlCrear}
                onChange={(e) => setCrearClaseAlCrear(e.target.checked)}
                className="accent-primary"
              />
              <span className="text-xs text-text-1">Crear una clase en esta unidad ahora</span>
            </label>
            <p className="text-[11px] text-text-3 mt-1">
              Al crear la unidad se abre el formulario para cargar la clase.
            </p>
            {sectionMsg && <p className="text-xs text-success mt-2">{sectionMsg}</p>}
            {sectionError && <p className="text-xs text-danger mt-2">{sectionError}</p>}
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
                  {...materialDeleteProps(f)}
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

          <ReportesMaterialCard materiaId={activeCourse} />

          <ContentAccessCard materiaId={activeCourse} />
        </aside>
      </div>

      <ActivityFormModal
        open={activityOpen}
        onClose={() => {
          setActivityOpen(false);
          setEvalTarget(null);
        }}
        materiaId={activeCourse}
        sections={sections ?? []}
        classes={allClasses}
        rubrics={rubrics ?? []}
        editing={null}
        initialSectionId={evalTarget?.sectionId}
        initialClassId={evalTarget?.classId}
      />

      <ClassFormModal
        open={classModalOpen}
        onClose={() => {
          setClassModalOpen(false);
          setClassModalSectionId(null);
        }}
        courseId={activeCourse}
        sections={sections ?? []}
        initialSectionId={classModalSectionId}
        existingClasses={allClasses}
        contentOptions={contentOptions}
        onCreated={(info) => {
          setSectionId(info.sectionId);
          setClassId(null);
          const unidad = (sections ?? []).find((s) => s.id === info.sectionId)?.nombre ?? "la unidad";
          setSectionMsg(`Clase "${info.title}" creada en ${unidad}.`);
        }}
      />

      <ClassMaterialModal
        open={Boolean(materialTarget)}
        onClose={() => setMaterialTarget(null)}
        courseId={activeCourse}
        classDate={materialTarget?.classDate ?? ""}
        className={materialTarget?.className ?? ""}
        contentOptions={contentOptions}
        onAssigned={(label) =>
          setSavedMsg(`Material "${label}" asignado a ${materialTarget?.className ?? "la clase"}.`)
        }
      />
    </div>
  );
}
