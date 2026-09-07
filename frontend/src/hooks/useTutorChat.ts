import { useEffect, useRef, useState } from "react";
import type { Course, TutorMessage } from "../types/domain";
import { askTutor, createTutorSession, type ModoTutor } from "../services/tutor.service";

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
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setPending(true);
    try {
      const sesionId = await obtenerSesion(course.id, modo);
      const result = await askTutor(sesionId, question);
      setMessages((prev) => [...prev, { role: "tutor", content: result.respuesta.contenido }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "tutor", content: "No se pudo obtener respuesta del tutor en este momento. Intentalo de nuevo." },
      ]);
    } finally {
      setPending(false);
    }
  }

  return { messages, pending, ask };
}