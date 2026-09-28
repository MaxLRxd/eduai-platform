import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCourse } from "../../hooks/useCourses";
import { useTutorChat } from "../../hooks/useTutorChat";
import type { ModoTutor } from "../../services/tutor.service";
import { Card, CardHeader } from "../../components/ui/Card";
import { Tag } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import { ResumenPanel } from "../../components/student/ResumenPanel";
import { SimulacroPanel } from "../../components/student/SimulacroPanel";

const UNIT_TAG_COLOR = {
  "En curso": "blue",
  Completada: "green",
  Próxima: "amber",
  Disponible: "gray",
} as const;

const MODO_LABEL: Record<ModoTutor, string> = {
  NORMAL: "Normal",
  SOCRATIC: "🧠 Socrático",
  HINTS: "💡 Pistas",
};

const MODO_NOMBRE: Record<ModoTutor, string> = {
  NORMAL: "normal",
  SOCRATIC: "socrático",
  HINTS: "pistas",
};

const MODO_BANNER: Record<ModoTutor, string> = {
  NORMAL: "",
  SOCRATIC:
    "Modo estudio activo: el tutor no te da la respuesta directa, sino que te guía con preguntas para que descubras el concepto.",
  HINTS:
    "Modo pistas activo: el tutor te encamina paso a paso con pistas progresivas, sin revelar la respuesta completa.",
};

export function StudentCourseDetailPage(): React.ReactElement {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { data: course, isLoading } = useCourse(courseId);
  const { messages, pending, ask } = useTutorChat(course);
  const [question, setQuestion] = useState("");
  const [activeModo, setActiveModo] = useState<ModoTutor>("NORMAL");

  if (isLoading) return <p className="text-sm text-text-2">Cargando materia…</p>;
  if (!course) return <p className="text-sm text-text-2">No se encontró la materia.</p>;

  const submitQuestion = (text: string, modo: ModoTutor = activeModo): void => {
    void ask(text, modo);
    setQuestion("");
  };

  return (
    <div>
      <div className="flex justify-between gap-3.5 items-start mb-6">
        <div>
          <Button variant="ghost" size="sm" className="mb-3" onClick={() => navigate("/student/courses")}>
            ← Volver a mis materias
          </Button>
          <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">{course.name}</h2>
          <p className="text-[13px] text-text-2">{course.professor} · Aula virtual con unidades, materiales y tutor IA contextual</p>
        </div>
        <Tag color="green">{course.progress}% cursado</Tag>
      </div>

      <Card className="mb-4.5" style={{ borderLeft: `4px solid ${course.color}` }}>
        <div className="flex justify-between gap-4.5 items-center flex-wrap">
          <div className="max-w-2xl">
            <h3 className="font-display text-base mb-1">Aula de {course.name}</h3>
            <p className="text-[13px] text-text-2">{course.intro}</p>
          </div>
          <Button onClick={() => document.getElementById("tutor-input")?.focus()}>Consultar al Tutor IA</Button>
        </div>
      </Card>

      <div className="grid xl:grid-cols-[2fr_1fr] gap-5">
        <Card>
          <CardHeader title="📚 Unidades de estudio" action={<Tag color="gray">Similar a Moodle</Tag>} />
          <div className="flex flex-col gap-3">
            {course.units.map((u, idx) => (
              <div key={u.title} className="border border-border rounded overflow-hidden">
                <div className="px-3.5 py-3 bg-surface-2 flex justify-between gap-2.5 items-center">
                  <strong className="text-[13px] text-text-1">{u.title}</strong>
                  <Tag color={UNIT_TAG_COLOR[u.status]}>{u.status}</Tag>
                </div>
                <div className="px-3.5 py-3 flex flex-col gap-2">
                  {u.items.map((it, i) => (
                    <div key={it} className="flex items-start gap-3 py-1.5">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: i === 0 ? course.color : "#94a3b8" }} />
                      <div className="flex-1">
                        <div className="text-[13px] text-text-1 font-medium">{it}</div>
                        <div className="text-[11px] text-text-3 mt-0.5">
                          Recurso de la materia · {idx === 1 ? "visible para estudiantes" : "habilitado por el profesor"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {course.units.length === 0 && (
              <div className="py-6 text-center text-[12px] text-text-3">El profesor todavía no cargó unidades en esta materia.</div>
            )}
          </div>
        </Card>

        <aside className="flex flex-col gap-4.5">
          <Card>
            <CardHeader title="🤖 Tutor IA de la materia" />
            <p className="text-xs text-text-2 mb-3">
              Responde usando el contexto de <strong>{course.name}</strong>: {course.tutorFocus}.
            </p>

            <div className="flex gap-2 flex-wrap mb-2.5">
              {(["NORMAL", "SOCRATIC", "HINTS"] as ModoTutor[]).map((modo) => (
                <Button
                  key={modo}
                  variant={activeModo === modo ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setActiveModo(modo)}
                >
                  {MODO_LABEL[modo]}
                </Button>
              ))}
            </div>
            {MODO_BANNER[activeModo] && (
              <div
                className={`p-2.5 mb-2.5 rounded text-[12px] leading-relaxed ${
                  activeModo === "SOCRATIC"
                    ? "bg-violet-50 border-[1.5px] border-violet-600 text-violet-700"
                    : "bg-amber-50 border-[1.5px] border-warning text-amber-700"
                }`}
              >
                {MODO_BANNER[activeModo]}
              </div>
            )}

            <div className="flex gap-2 flex-wrap mb-2.5">
              <Button variant="secondary" size="sm" onClick={() => submitQuestion("Explicame la unidad actual con palabras simples", "NORMAL")}>
                Explicame fácil
              </Button>
              <Button variant="secondary" size="sm" onClick={() => submitQuestion("Dame preguntas para practicar", "NORMAL")}>
                Practicar
              </Button>
            </div>

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto mb-2.5">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`text-[13px] p-2.5 rounded leading-relaxed ${
                    m.role === "user" ? "bg-primary-light text-primary self-end" : "bg-surface-2 text-text-2"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {pending && <div className="text-[13px] text-text-3 italic">El tutor está pensando…</div>}
              {messages.length === 0 && !pending && (
                <div className="p-3 rounded bg-surface-2 text-[13px] text-text-2 leading-relaxed">
                  El tutor está listo para responder sobre {course.name} usando las unidades y materiales de esta aula.
                </div>
              )}
            </div>

            <textarea
              id="tutor-input"
              className="w-full px-3 py-2 border border-border rounded text-sm"
              rows={3}
              placeholder={
                activeModo === "SOCRATIC"
                  ? "Escribí tu respuesta o consulta del modo estudio…"
                  : activeModo === "HINTS"
                    ? "Preguntá y pedí pistas paso a paso…"
                    : "Preguntá sobre esta materia..."
              }
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitQuestion(question);
                }
              }}
            />
            <Button fullWidth className="mt-2.5 justify-center" onClick={() => submitQuestion(question)} disabled={!question.trim() || pending}>
              {activeModo === "NORMAL" ? "Preguntar al tutor" : `Enviar en modo ${MODO_NOMBRE[activeModo]}`}
            </Button>
          </Card>

          <Card>
            <CardHeader title="📌 Material usado por la IA" />
            <div className="flex flex-col gap-2">
              {course.materiales.map((m) => (
                <div key={m.id} className="flex items-start gap-3 py-1.5">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: course.color }} />
                  <div>
                    <div className="text-[13px] text-text-1 font-medium">{m.titulo}</div>
                    <div className="text-[11px] text-text-3 mt-0.5">
                      {m.resumible ? "Disponible para el Tutor IA" : "Archivo · no indexado"}
                    </div>
                  </div>
                </div>
              ))}
              {course.materiales.length === 0 && (
                <div className="py-4 text-center text-[12px] text-text-3">Todavía no hay materiales indexados para el tutor.</div>
              )}
            </div>
          </Card>

          <ResumenPanel course={course} />
          <SimulacroPanel course={course} />
        </aside>
      </div>
    </div>
  );
}
