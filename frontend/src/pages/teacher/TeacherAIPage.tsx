import React, { useEffect, useMemo, useState } from "react";
import { useTeacherCourses } from "../../hooks/useTeacherCourses";
import { usePlanning } from "../../hooks/usePlanning";
import { useTeacherAssistant } from "../../hooks/useTeacherAssistant";
import { useCourseContentTree, useCourseSections, useUploadMaterial } from "../../hooks/useContent";
import { TutorLatencyCard } from "../../components/teacher/TutorLatencyCard";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { InfoBox } from "../../components/ui/InfoBox";
import { Modal } from "../../components/ui/Modal";
import { apiErrorMessage, apiUrl } from "../../services/api";
import type { RagStatus } from "../../types/domain";

interface MaterialOption {
  id: string;
  name: string;
  label: string;
  context: string;
  status: RagStatus | "Sin archivo";
  seleccionable: boolean;
  url?: string;
  meta: string;
  origen: "Contenido" | "Planificación";
  motivo?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MATERIALES = 10;

function estadoMaterialClass(status: MaterialOption["status"]): string {
  if (status === "Indexado") return "bg-success-light text-emerald-800";
  if (status === "Indexando…") return "bg-info-light text-blue-800";
  return "bg-surface-2 text-text-3";
}

const QUICK_ACTIONS = [
  "Crear actividades diferenciadas",
  "Resumir material para alumnos",
  "Generar preguntas de comprensión",
  "Adaptar consigna con apoyos visuales",
];

export function TeacherAIPage(): React.ReactElement {
  const { data: courses } = useTeacherCourses();
  const [courseId, setCourseId] = useState<string | null>(null);
  const activeCourse = courseId ?? courses?.[0]?.id ?? null;
  const courseLabel = courses?.find((c) => c.id === activeCourse)?.label ?? "la materia seleccionada";

  const { data: planning } = usePlanning(activeCourse, courseLabel);
  const {
    output,
    setOutput,
    pending,
    pdfPending,
    messages,
    sesiones,
    sesionActivaId,
    cargandoHistorial,
    ask,
    seleccionarConversacion,
    nuevaConversacion,
    downloadPdf,
  } = useTeacherAssistant(activeCourse);
  const { data: sections } = useCourseSections(activeCourse);
  const { data: contentTree } = useCourseContentTree(activeCourse);
  const publicar = useUploadMaterial();

  const [classDate, setClassDate] = useState(planning?.[0]?.date ?? "");
  const [prompt, setPrompt] = useState("");
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [conSoluciones, setConSoluciones] = useState(false);
  const [seccionDestino, setSeccionDestino] = useState("");
  const [tituloPublicacion, setTituloPublicacion] = useState("");
  const [aviso, setAviso] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);
  const [contentIds, setContentIds] = useState<string[]>([]);
  const [materialModal, setMaterialModal] = useState(false);
  const [busquedaMaterial, setBusquedaMaterial] = useState("");

  const materialOptions = useMemo<MaterialOption[]>(() => {
    const delArbol: MaterialOption[] = (contentTree ?? []).flatMap((seccion) => [
      ...seccion.materials.map((m) => ({
        id: m.id,
        name: m.name,
        label: `${seccion.nombre} · ${m.name}`,
        context: seccion.nombre,
        status: m.ragStatus,
        seleccionable: UUID.test(m.id),
        url: m.url,
        meta: [m.fileType.toUpperCase(), m.sizeLabel, m.date].filter(Boolean).join(" · "),
        origen: "Contenido" as const,
        motivo: UUID.test(m.id) ? undefined : "Este archivo no tiene un contenido guardado; volvé a subirlo desde Planificación.",
      })),
      ...seccion.classes.flatMap((clase) =>
        clase.materials.map((m) => ({
          id: m.id,
          name: m.name,
          label: `${seccion.nombre} · ${clase.title || clase.date} · ${m.name}`,
          context: `${seccion.nombre} · ${clase.title || clase.date}`,
          status: m.ragStatus,
          seleccionable: UUID.test(m.id),
          url: m.url,
          meta: [m.fileType.toUpperCase(), m.sizeLabel, m.date].filter(Boolean).join(" · "),
          origen: "Contenido" as const,
          motivo: UUID.test(m.id) ? undefined : "Este archivo no tiene un contenido guardado; volvé a subirlo desde Planificación.",
        }))
      ),
    ]);

    const vistos = new Set(delArbol.map((m) => m.url).filter((u): u is string => Boolean(u)));
    const dePlanning: MaterialOption[] = (planning ?? []).flatMap((clase) =>
      clase.attachments.flatMap((adjunto) => {
        const url = apiUrl(adjunto.url) ?? undefined;
        if (!url || vistos.has(url)) return [];
        vistos.add(url);
        return [{
          id: `planificacion-${clase.id}-${adjunto.name}`,
          name: adjunto.name,
          label: `${clase.title || clase.date} · ${adjunto.name}`,
          context: `Planificación · ${clase.date}`,
          status: "Sin indexar" as const,
          seleccionable: false,
          url,
          meta: adjunto.sizeLabel || "Adjunto de planificación",
          origen: "Planificación" as const,
          motivo: "Se puede abrir, pero para usarla como filtro de IA debe estar en Contenidos.",
        }];
      })
    );

    return [...delArbol, ...dePlanning].filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i);
  }, [contentTree, planning]);

  const seleccionados = materialOptions.filter((m) => contentIds.includes(m.id));
  const seleccionNoIndexada = seleccionados.some((m) => m.status !== "Indexado");
  const materialesFiltrados = materialOptions.filter((m) =>
    `${m.name} ${m.context} ${m.status} ${m.origen}`.toLowerCase().includes(busquedaMaterial.trim().toLowerCase())
  );

  useEffect(() => {
    setContentIds([]);
    setBusquedaMaterial("");
  }, [activeCourse]);

  const alternarMaterial = (material: MaterialOption): void => {
    if (!material.seleccionable || pending) return;
    setContentIds((prev) =>
      prev.includes(material.id)
        ? prev.filter((id) => id !== material.id)
        : prev.length < MAX_MATERIALES
          ? [...prev, material.id]
          : prev
    );
  };

  const seleccionarIndexados = (): void => {
    const ids = materialOptions
      .filter((m) => m.seleccionable && m.status === "Indexado")
      .slice(0, MAX_MATERIALES)
      .map((m) => m.id);
    setContentIds(ids);
  };

  const abrirMaterial = (material: MaterialOption): void => {
    if (material.url) window.open(material.url, "_blank", "noopener,noreferrer");
  };

  // CU-P10 (FA1): con soluciones, la IA marca las respuestas correctas para uso interno del docente.
  const pedido = (text: string): string =>
    conSoluciones
      ? `${text}\n\nIncluí la solución de cada ejercicio, marcando claramente las respuestas correctas (material de uso interno del docente).`
      : text;

  const runPrompt = (text: string): void => {
    setPrompt(text);
    void ask(pedido(text), activeCourse, classDate || undefined, contentIds);
  };

  const destino = seccionDestino || sections?.[0]?.id || "";

  // CU-P10: el docente revisa/edita el material y lo publica como contenido de una sección.
  const handlePublicar = (): void => {
    if (!output || !destino || !tituloPublicacion.trim()) return;
    setAviso(null);
    publicar.mutate(
      { sectionId: destino, title: tituloPublicacion.trim(), body: output },
      {
        onSuccess: () => {
          setAviso({ tipo: "success", texto: "✅ Material publicado: los alumnos ya lo ven en la sección y el Tutor IA lo indexa." });
          setTituloPublicacion("");
        },
        onError: (e) => setAviso({ tipo: "error", texto: apiErrorMessage(e, "No se pudo publicar el material.") }),
      }
    );
  };

  const handleDownloadPdf = (): void => {
    setPdfError(null);
    downloadPdf(activeCourse, prompt.trim().slice(0, 80) || undefined).catch((e: unknown) =>
      setPdfError(apiErrorMessage(e, "No se pudo generar el PDF"))
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Inteligencia Artificial</h2>
        <p className="text-[13px] text-text-2">Asistente docente conectado a la planificación diaria, materiales y seguimiento del curso.</p>
      </div>

      <div className="grid xl:grid-cols-[2fr_1fr] gap-5">
        <Card>
          <CardHeader title="Consultá usando la planificación cargada" />
          <InfoBox variant="info">🤖 La IA puede tomar como contexto las planificaciones por día, los materiales publicados y las consignas visibles para estudiantes.</InfoBox>
          <InfoBox variant="info">💬 La conversación se guarda automáticamente. Si cerrás la pestaña mientras se genera, el navegador te avisará.</InfoBox>

          <div className="grid md:grid-cols-2 gap-3 mb-4">
            <div>
              <label htmlFor="teacher-ai-course" className="block text-xs font-semibold text-text-1 mb-1.5">
                Materia / curso
              </label>
              <select
                id="teacher-ai-course"
                value={activeCourse ?? ""}
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
              <label htmlFor="teacher-ai-date" className="block text-xs font-semibold text-text-1 mb-1.5">
                Clase de referencia
              </label>
              <select
                id="teacher-ai-date"
                value={classDate}
                onChange={(e) => setClassDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
              >
                {(planning ?? []).map((p) => (
                  <option key={p.date} value={p.date}>
                    {p.date} · {p.title || "Sin cargar"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3 mb-4">
            <div>
              <label htmlFor="teacher-ai-sesion" className="block text-xs font-semibold text-text-1 mb-1.5">
                Conversación
              </label>
              <select
                id="teacher-ai-sesion"
                value={sesionActivaId ?? ""}
                onChange={(e) =>
                  e.target.value ? void seleccionarConversacion(e.target.value) : nuevaConversacion()
                }
                disabled={pending}
                className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
              >
                <option value="">Nueva conversación</option>
                {sesiones.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.titulo || new Date(s.iniciada_en).toLocaleString("es-AR")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label id="teacher-ai-materiales" className="block text-xs font-semibold text-text-1">
                  Materiales de referencia
                </label>
                <span className="text-[11px] text-text-3">
                  {seleccionados.length} de {MAX_MATERIALES} seleccionados
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMaterialModal(true)}
                aria-labelledby="teacher-ai-materiales"
                className="w-full min-h-20 flex items-center justify-between gap-4 p-4 border-2 border-border hover:border-primary rounded-lg bg-surface-2 text-left transition-colors"
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-sm text-text-1">Elegir materiales del curso</span>
                  <span className="block text-xs text-text-2 mt-0.5 truncate">
                    {seleccionados.length > 0
                      ? seleccionados.map((m) => m.name).join(", ")
                      : `${materialOptions.length} materiales: contenidos y adjuntos de planificación`}
                  </span>
                </span>
                <span className="shrink-0 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white">
                  Seleccionar
                </span>
              </button>
              {seleccionados.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {seleccionados.map((m) => (
                    <span key={m.id} className="inline-flex items-center gap-1.5 rounded-full bg-info-light px-2.5 py-1 text-xs font-medium text-blue-900">
                      {m.name}
                      <button
                        type="button"
                        onClick={() => setContentIds((prev) => prev.filter((id) => id !== m.id))}
                        aria-label={`Quitar ${m.name}`}
                        className="font-bold hover:text-danger"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {seleccionNoIndexada && (
                <div className="mt-2">
                  <InfoBox variant="warning">
                    Algunos materiales seleccionados no están indexados. Indexalos en Contenidos o quitá el filtro; si no, la IA no podrá usarlos.
                  </InfoBox>
                </div>
              )}
            </div>
          </div>

          {cargandoHistorial && <p className="text-xs text-text-2 mb-2">Cargando conversación…</p>}
          {messages.length > 0 && (
            <div className="max-h-52 overflow-y-auto border border-border rounded bg-surface-2 p-3 mb-4 space-y-2">
              {messages.map((m, i) => (
                <div key={m.id ?? `temp-${i}`} className="text-[13px]">
                  <span className="font-bold text-primary">{m.role === "user" ? "Vos" : "Asistente"}: </span>
                  <span className="whitespace-pre-wrap text-text-1">{m.content || (pending ? "Generando…" : "")}</span>
                  {m.role === "assistant" && m.sources.length > 0 && (
                    <div className="mt-1 text-[11px] text-text-3">
                      Fuentes: {m.sources.map((s, si) => (
                        <span key={`${s.material_id}-${s.chunk_index ?? si}`}>
                          {si > 0 ? ", " : ""}{s.titulo || s.material_id}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mb-3.5">
            <label htmlFor="teacher-ai-prompt" className="block text-xs font-semibold text-text-1 mb-1.5">
              Pedido para la IA
            </label>
            <textarea
              id="teacher-ai-prompt"
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej.: Armame preguntas de repaso según la planificación de hoy, adaptadas para estudiantes con distintos niveles."
              className="w-full px-3 py-2 border border-border rounded text-sm"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => void ask(pedido(prompt), activeCourse, classDate || undefined, contentIds)} disabled={!prompt.trim() || pending}>
              {pending ? "Generando…" : "Generar respuesta"}
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() =>
                runPrompt(
                  "Prepará la clase del día con el material de la materia: actividades, momentos de la clase, consignas y cierre."
                )
              }
            >
              Usar materiales del día
            </Button>
          </div>

          <label className="flex items-center gap-2 text-xs text-text-2 mt-3">
            <input type="checkbox" checked={conSoluciones} onChange={(e) => setConSoluciones(e.target.checked)} />
            Incluir las soluciones (uso interno del docente)
          </label>

          {output === null ? (
            <div className="mt-4 p-3.5 border border-border rounded bg-surface-2 text-[13px] text-text-2">
              La respuesta aparecerá acá. Podrás editarla antes de descargarla o publicarla.
            </div>
          ) : (
            <div className="mt-4">
              <label htmlFor="teacher-ai-output" className="block text-xs font-semibold text-text-1 mb-1.5">
                Material generado (editable)
              </label>
              <textarea
                id="teacher-ai-output"
                rows={14}
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded text-[13px] bg-surface-2 leading-relaxed"
              />

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Button variant="secondary" onClick={handleDownloadPdf} disabled={pdfPending || pending}>
                  {pdfPending ? "Generando PDF…" : "📄 Descargar PDF"}
                </Button>
              </div>
              {pdfError && <InfoBox variant="error">{pdfError}</InfoBox>}

              <div className="mt-4 pt-3.5 border-t border-border">
                <div className="text-xs font-bold text-text-1 mb-2">Publicar en una sección de la materia</div>
                {conSoluciones && (
                  <InfoBox variant="warning">
                    Este material incluye las soluciones. Si lo publicás, los alumnos las van a ver: quitalas antes.
                  </InfoBox>
                )}
                <div className="grid md:grid-cols-2 gap-2 mb-2.5">
                  <div>
                    <label htmlFor="publish-section" className="block text-xs font-semibold text-text-1 mb-1.5">
                      Sección
                    </label>
                    <select
                      id="publish-section"
                      value={destino}
                      onChange={(e) => setSeccionDestino(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
                    >
                      {(sections ?? []).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="publish-title" className="block text-xs font-semibold text-text-1 mb-1.5">
                      Título
                    </label>
                    <input
                      id="publish-title"
                      value={tituloPublicacion}
                      onChange={(e) => setTituloPublicacion(e.target.value)}
                      placeholder="Ej.: Guía de repaso — Unidad 2"
                      className="w-full px-3 py-2 border border-border rounded text-sm"
                    />
                  </div>
                </div>
                {(sections ?? []).length === 0 && (
                  <p className="text-[11px] text-text-3 mb-2">Esta materia no tiene secciones: creá una en Contenidos.</p>
                )}
                <Button
                  onClick={handlePublicar}
                  disabled={!destino || !tituloPublicacion.trim() || !output.trim() || publicar.isPending}
                >
                  {publicar.isPending ? "Publicando…" : "📚 Publicar en la sección"}
                </Button>
                {aviso && <InfoBox variant={aviso.tipo}>{aviso.texto}</InfoBox>}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Accesos rápidos" />
          {QUICK_ACTIONS.map((t) => (
            <Button key={t} variant="ghost" fullWidth className="justify-start mb-2" onClick={() => runPrompt(`${t} según la planificación seleccionada.`)}>
              ✨ {t}
            </Button>
          ))}
          <div className="h-px bg-border my-3.5" />
          <div className="text-xs text-text-2">
            <strong>Contexto disponible:</strong>
            <br />
            Planificación diaria, materiales cargados, objetivos, actividades y visibilidad para estudiantes.
          </div>
        </Card>

        <TutorLatencyCard materiaId={activeCourse} />
      </div>

      <Modal open={materialModal} onClose={() => setMaterialModal(false)} title="Materiales de referencia" wide>
        <div className="flex flex-col gap-3">
          <input
            type="search"
            value={busquedaMaterial}
            onChange={(e) => setBusquedaMaterial(e.target.value)}
            placeholder="Buscar por material, unidad o clase"
            aria-label="Buscar materiales"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={seleccionarIndexados} disabled={pending}>
              Seleccionar indexados
            </Button>
            <button
              type="button"
              onClick={() => setContentIds([])}
              disabled={pending || contentIds.length === 0}
              className="text-xs text-primary hover:underline disabled:opacity-40"
            >
              Limpiar selección
            </button>
            <span className="ml-auto text-xs text-text-3">
              {contentIds.length}/{MAX_MATERIALES} seleccionados
            </span>
          </div>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {materialesFiltrados.length === 0 && (
              <p className="p-4 text-sm text-text-3 border border-dashed border-border rounded-lg">
                No hay materiales que coincidan con la búsqueda.
              </p>
            )}
            {materialesFiltrados.map((m) => {
              const checked = contentIds.includes(m.id);
              const sinCupo = !checked && contentIds.length >= MAX_MATERIALES;
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                    checked ? "border-primary bg-info-light" : "border-border bg-surface"
                  } ${!m.seleccionable ? "opacity-80" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => alternarMaterial(m)}
                    disabled={pending || !m.seleccionable || sinCupo}
                    aria-pressed={checked}
                    aria-label={m.label}
                    className="flex flex-1 items-center gap-3 text-left min-w-0 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs font-bold ${
                        checked ? "border-primary bg-primary text-white" : "border-border bg-surface"
                      }`}
                    >
                      {checked ? "✓" : ""}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-text-1">{m.name}</span>
                      <span className="block truncate text-xs text-text-2">
                        {m.origen} · {m.context} · {m.meta}
                      </span>
                      {m.motivo && <span className="block text-[11px] text-text-3 mt-0.5">{m.motivo}</span>}
                    </span>
                  </button>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${estadoMaterialClass(m.status)}`}>
                    {m.status}
                  </span>
                  {m.url && (
                    <button
                      type="button"
                      onClick={() => abrirMaterial(m)}
                      aria-label={`Abrir ${m.name}`}
                      className="shrink-0 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-surface-2"
                    >
                      Abrir ↗
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-text-3">
            Sin selección se usa toda la materia. Los adjuntos de Planificación se pueden abrir, pero para filtrar por IA deben estar en Contenidos.
          </p>
          <div className="flex justify-end border-t border-border pt-3">
            <Button onClick={() => setMaterialModal(false)}>Listo ({seleccionados.length})</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
