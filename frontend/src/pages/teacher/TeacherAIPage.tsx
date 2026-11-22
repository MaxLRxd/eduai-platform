import React, { useEffect, useState } from "react";
import { useTeacherCourses } from "../../hooks/useTeacherCourses";
import { usePlanning } from "../../hooks/usePlanning";
import { useTeacherAssistant } from "../../hooks/useTeacherAssistant";
import { useCourseContentTree, useCourseSections, useUploadMaterial } from "../../hooks/useContent";
import { TutorLatencyCard } from "../../components/teacher/TutorLatencyCard";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { InfoBox } from "../../components/ui/InfoBox";
import { apiErrorMessage } from "../../services/api";
import type { RagStatus } from "../../types/domain";

interface MaterialOption {
  id: string;
  label: string;
  status: RagStatus;
  seleccionable: boolean;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const materialOptions: MaterialOption[] = (contentTree ?? [])
    .flatMap((seccion) => [
      ...seccion.materials.map((m) => ({
        id: m.id,
        label: `${seccion.nombre} · ${m.name}`,
        status: m.ragStatus,
        seleccionable: UUID.test(m.id),
      })),
      ...seccion.classes.flatMap((clase) =>
        clase.materials.map((m) => ({
          id: m.id,
          label: `${seccion.nombre} · ${clase.title || clase.date} · ${m.name}`,
          status: m.ragStatus,
          seleccionable: UUID.test(m.id),
        }))
      ),
    ])
    .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i);

  const seleccionados = materialOptions.filter((m) => contentIds.includes(m.id));
  const seleccionNoIndexada = seleccionados.some((m) => m.status !== "Indexado");

  useEffect(() => {
    setContentIds([]);
  }, [activeCourse]);

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

          <div className="grid md:grid-cols-2 gap-2.5 mb-3.5">
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
            <div className="md:col-span-2">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label id="teacher-ai-materiales" className="block text-xs font-semibold text-text-1">
                  Materiales de referencia
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-text-3">
                    {seleccionados.length} seleccionado{seleccionados.length === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setContentIds([])}
                    disabled={pending || contentIds.length === 0}
                    className="text-xs text-primary hover:underline disabled:opacity-40"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
              <div
                role="group"
                aria-labelledby="teacher-ai-materiales"
                className="max-h-64 overflow-y-auto border border-border rounded-lg bg-surface p-2 space-y-1"
              >
                {materialOptions.length === 0 && (
                  <p className="text-xs text-text-3 p-2">
                    Esta materia no tiene materiales. Subilos en Contenidos o en Planificación.
                  </p>
                )}
                {materialOptions.map((m) => {
                  const checked = contentIds.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className={`flex items-start gap-2.5 p-2 rounded-md cursor-pointer text-sm ${
                        m.seleccionable ? "hover:bg-surface-2" : "opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <input
                        type="checkbox"
                        aria-label={m.label}
                        checked={checked}
                        disabled={pending || !m.seleccionable}
                        onChange={(e) =>
                          setContentIds((prev) =>
                            e.target.checked ? [...prev, m.id] : prev.filter((id) => id !== m.id)
                          )
                        }
                        className="mt-0.5 h-4 w-4 accent-primary"
                      />
                      <span className="flex-1 leading-snug text-text-1">{m.label}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          m.status === "Indexado"
                            ? "bg-success-light text-emerald-800"
                            : m.status === "Indexando…"
                              ? "bg-info-light text-blue-800"
                              : "bg-surface-2 text-text-3"
                        }`}
                      >
                        {m.status}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-text-3 mt-1.5">
                Elegí los materiales que querés usar como contexto. Sin selección se usa toda la materia.
                Los materiales marcados “Sin indexar” no pueden filtrarse todavía.
              </p>
              {seleccionNoIndexada && (
                <InfoBox variant="warning">
                  Algunos materiales seleccionados no están indexados. Indexalos en Contenidos o quitá el filtro; si no, la IA no podrá usarlos.
                </InfoBox>
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

          <div className="mb-3.5">
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
    </div>
  );
}
