import React, { useState } from "react";
import { useTeacherCourses } from "../../hooks/useTeacherCourses";
import { useUploadedMaterials, useUploadMaterial } from "../../hooks/useContent";
import { CONTENT_SECTIONS } from "../../data/mock/content.mock";
import { Card, CardHeader } from "../../components/ui/Card";
import { Tag, type TagColor } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import type { RagStatus, UploadedMaterial } from "../../types/domain";

const FILE_ICON: Record<UploadedMaterial["fileType"], string> = { pdf: "📄", pptx: "📊", docx: "📝", txt: "🗒️", img: "🖼️" };
const RAG_COLOR: Record<RagStatus, TagColor> = { Indexado: "green", "Indexando…": "blue", "Sin indexar": "gray" };
const RAG_LABEL: Record<RagStatus, string> = { Indexado: "🤖 RAG", "Indexando…": "⏳ RAG", "Sin indexar": "— RAG" };

export function TeacherContentPage(): React.ReactElement {
  const { data: courses } = useTeacherCourses();
  const { data: materials, isLoading } = useUploadedMaterials();
  const upload = useUploadMaterial();

  const [courseId, setCourseId] = useState("prog2");
  const [section, setSection] = useState(CONTENT_SECTIONS[0]);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceBody, setResourceBody] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const handleUpload = (file: File): void => {
    upload.mutate(file.name);
  };

  const handleSaveText = (): void => {
    if (!resourceTitle.trim()) return;
    setSavedMsg("✅ Texto guardado e indexado por el RAG Pipeline");
    setResourceTitle("");
    setResourceBody("");
  };

  return (
    <div>
      <div className="flex justify-between items-start gap-3.5 flex-wrap mb-6">
        <div>
          <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Contenidos y materiales</h2>
          <p className="text-[13px] text-text-2">Subí material a las secciones — el RAG Pipeline lo indexa automáticamente para el Tutor IA</p>
        </div>
        <Tag color="green">🤖 RAG Pipeline activo</Tag>
      </div>

      <div className="grid xl:grid-cols-[2fr_1fr] gap-5">
        <div className="flex flex-col gap-4.5">
          <Card>
            <CardHeader title="Seleccionar destino" />
            <div className="mb-3.5">
              <label htmlFor="content-course" className="block text-xs font-semibold text-text-1 mb-1.5">
                Materia
              </label>
              <select
                id="content-course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
              >
                {(courses ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} — {c.curso}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="content-section" className="block text-xs font-semibold text-text-1 mb-1.5">
                Sección destino
              </label>
              <select
                id="content-section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
              >
                {CONTENT_SECTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </Card>

          <Card>
            <CardHeader title="📎 Subir archivo" />
            <label
              htmlFor="content-file-input"
              className="block border-2 border-dashed border-border-strong rounded p-7 bg-surface-2 text-center cursor-pointer"
            >
              <div className="text-2xl mb-2">📂</div>
              <div className="font-semibold text-text-1 mb-1">Hacé click o arrastrá un archivo aquí</div>
              <div className="text-xs text-text-3">PDF, PPTX, DOCX, JPG, PNG, TXT · Máx. 50 MB</div>
              <input
                id="content-file-input"
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.pptx,.docx,.jpg,.png,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
            </label>
            {upload.isPending && <p className="text-xs text-text-2 mt-2.5">Subiendo e indexando…</p>}
          </Card>

          <Card>
            <CardHeader title="✏️ Agregar texto o consigna" />
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
            <Button onClick={handleSaveText} disabled={!resourceTitle.trim()}>
              Guardar y publicar
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
                    <div className="text-xs font-semibold text-text-1 truncate">{f.name}</div>
                    <div className="text-[11px] text-text-3">
                      {f.sizeLabel} · {f.date}
                    </div>
                  </div>
                  <Tag color={RAG_COLOR[f.ragStatus]}>{RAG_LABEL[f.ragStatus]}</Tag>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-text-2 mt-3.5 bg-info-light border border-blue-200 rounded px-3 py-2">
              Los archivos marcados como <strong>🤖 RAG</strong> ya están disponibles para el Tutor IA de la materia.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
