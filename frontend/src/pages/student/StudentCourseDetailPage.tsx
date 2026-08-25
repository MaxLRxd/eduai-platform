import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCourse } from "../../hooks/useCourses";
import { useTutorChat } from "../../hooks/useTutorChat";
import { Card, CardHeader } from "../../components/ui/Card";
import { Tag } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";

const UNIT_TAG_COLOR = {
  "En curso": "blue",
  Completada: "green",
  Próxima: "amber",
  Disponible: "gray",
} as const;

type Mode = "idle" | "study" | "exam";

export function StudentCourseDetailPage(): React.ReactElement {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { data: course, isLoading } = useCourse(courseId);
  const { messages, pending, ask } = useTutorChat(course);
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<Mode>("idle");
  const [studyAnswer, setStudyAnswer] = useState("");

  if (isLoading) return <p className="text-sm text-text-2">Cargando materia…</p>;
  if (!course) return <p className="text-sm text-text-2">No se encontró la materia.</p>;

  const submitQuestion = (text: string): void => {
    void ask(text);
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
          </div>
        </Card>

        <aside className="flex flex-col gap-4.5">
          <Card>
            <CardHeader title="🤖 Tutor IA de la materia" />
            <p className="text-xs text-text-2 mb-3">
              Responde usando el contexto de <strong>{course.name}</strong>: {course.tutorFocus}.
            </p>
            <div className="flex gap-2 flex-wrap mb-2.5">
              <Button variant="secondary" size="sm" onClick={() => submitQuestion("Explicame la unidad actual con palabras simples")}>
                Explicame fácil
              </Button>
              <Button variant="secondary" size="sm" onClick={() => submitQuestion("Dame preguntas para practicar")}>
                Practicar
              </Button>
              <Button variant="secondary" size="sm" onClick={() => submitQuestion("Resumí los materiales cargados")}>
                Resumir
              </Button>
            </div>
            <div className="flex gap-2 mb-3">
              <Button
                size="sm"
                className="flex-1 justify-center bg-gradient-to-br from-violet-600 to-violet-800 border-none"
                onClick={() => setMode(mode === "study" ? "idle" : "study")}
              >
                🧠 Modo Estudio
              </Button>
              <Button
                size="sm"
                className="flex-1 justify-center bg-gradient-to-br from-amber-500 to-amber-700 border-none"
                onClick={() => setMode(mode === "exam" ? "idle" : "exam")}
              >
                📝 Simulacro
              </Button>
            </div>

            {mode === "study" && (
              <div className="p-3 bg-violet-50 rounded border-[1.5px] border-violet-600 mb-2.5">
                <div className="font-bold text-violet-700 text-[13px] mb-2">🧠 Modo Estudio activado</div>
                <div className="text-[13px] text-text-1 mb-2.5 p-2.5 bg-white rounded">
                  ¿Podés explicar la diferencia entre una clase abstracta y una interfaz? ¿Cuándo usarías cada una?
                </div>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded text-sm mb-2"
                  rows={3}
                  placeholder="Escribí tu respuesta..."
                  value={studyAnswer}
                  onChange={(e) => setStudyAnswer(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => submitQuestion(`Corregí mi respuesta: ${studyAnswer}`)}>
                    Responder →
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => submitQuestion("Dame una pista para responder esta pregunta")}>
                    💡 Pista
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setMode("idle")}>
                    Salir
                  </Button>
                </div>
              </div>
            )}

            {mode === "exam" && (
              <div className="p-3 bg-amber-50 rounded border-[1.5px] border-warning mb-2.5">
                <div className="font-bold text-warning text-[13px] mb-2">📝 Simulacro de examen</div>
                <div className="text-xs text-text-2 mb-2.5">Indicá el tema o unidad (opcional) y generaré preguntas tipo examen.</div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-warning border-none" onClick={() => submitQuestion("Generá un simulacro de examen de esta materia")}>
                    Generar simulacro
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setMode("idle")}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

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
              placeholder="Preguntá sobre esta materia..."
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
              Preguntar al tutor
            </Button>
          </Card>

          <Card>
            <CardHeader title="📌 Material usado por la IA" />
            <div className="flex flex-col gap-2">
              {course.latest.map((x) => (
                <div key={x} className="flex items-start gap-3 py-1.5">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: course.color }} />
                  <div>
                    <div className="text-[13px] text-text-1 font-medium">{x}</div>
                    <div className="text-[11px] text-text-3 mt-0.5">Disponible para el Tutor IA</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
