import { useEffect, useRef, useState } from "react";
import type { Course, TutorMessage } from "../types/domain";
import { askTutorStream, createTutorSession, type ModoTutor } from "../services/tutor.service";

export function useTutorChat(course: Course | undefined) {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [pending, setPending] = useState(false);
  const sesionIdRef = useRef<string | null>(null);

  useEffect(() => {
    sesionIdRef.current = null;
    setMessages([]);
  }, [course?.id]);

  async function obtenerSesion(materiaId: string, modo: ModoTutor): Promise<string> {
    if (sesionIdRef.current) return sesionIdRef.current;
    const id = await createTutorSession(materiaId, modo);
    sesionIdRef.current = id;
    return id;
  }

  async function ask(question: string, modo: ModoTutor = "NORMAL"): Promise<void> {
    if (!course || !question.trim()) return;

    const sesionId = await obtenerSesion(course.id, modo);
    setMessages((prev) => [...prev, { role: "user", content: question }, { role: "tutor", content: "" }]);
    setPending(true);

    try {
      await askTutorStream(sesionId, question, (token) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "tutor") {
            next[next.length - 1] = { role: "tutor", content: last.content + token };
          }
          return next;
        });
      });
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === "tutor" && !last.content) {
          next[next.length - 1] = {
            role: "tutor",
            content: "No se pudo obtener respuesta del tutor en este momento. Intentalo de nuevo.",
          };
        }
        return next;
      });
    } finally {
      setPending(false);
    }
  }

  return { messages, pending, ask };
}