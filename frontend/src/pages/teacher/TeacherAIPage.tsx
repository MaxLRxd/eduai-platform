import React, { useState } from "react";
import { useTeacherCourses } from "../../hooks/useTeacherCourses";
import { usePlanning } from "../../hooks/usePlanning";
import { useTeacherAssistant } from "../../hooks/useTeacherAssistant";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { InfoBox } from "../../components/ui/InfoBox";

const QUICK_ACTIONS = [
  "Crear actividades diferenciadas",
  "Resumir material para alumnos",
  "Generar preguntas de comprensión",
  "Adaptar consigna con apoyos visuales",
];

export function TeacherAIPage(): React.ReactElement {
  const { data: courses } = useTeacherCourses();
  const { data: planning } = usePlanning();
  const { output, pending, ask } = useTeacherAssistant();

  const [courseId, setCourseId] = useState("prog2");
  const [classDate, setClassDate] = useState(planning?.[0]?.date ?? "");
  const [prompt, setPrompt] = useState("");

  const courseLabel = courses?.find((c) => c.id === courseId)?.label ?? "la materia seleccionada";

  const runPrompt = (text: string): void => {
    setPrompt(text);
    void ask(text, courseLabel);
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

          <div className="mb-3.5">
            <label htmlFor="teacher-ai-course" className="block text-xs font-semibold text-text-1 mb-1.5">
              Materia / curso
            </label>
            <select
              id="teacher-ai-course"
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
            <Button onClick={() => void ask(prompt, courseLabel)} disabled={!prompt.trim() || pending}>
              {pending ? "Generando…" : "Generar respuesta"}
            </Button>
            <Button variant="secondary">Usar materiales del día</Button>
          </div>

          <div className="mt-4 p-3.5 border border-border rounded bg-surface-2 text-[13px] text-text-2">
            {output ?? "La respuesta aparecerá acá."}
          </div>
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
      </div>
    </div>
  );
}
