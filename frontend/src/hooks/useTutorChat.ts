import { useEffect, useRef, useState } from "react";
import type { Course, TutorMessage } from "../types/domain";
import { askTutorStream, createTutorSession, type ModoTutor } from "../services/tutor.service";

export function useTutorChat(course: Course | undefined) {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [pending, setPending] = useState(false);
  const sesionIdRef = useRef<string | null>(null);
  // Ref y no solo estado: dos clicks seguidos llegan antes de que React
  // re-renderice con pending=true, y cada uno abria su propio streaming que
  // escribia tokens mezclados en la misma burbuja.
  const enCursoRef = useRef(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

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

  function actualizarRespuesta(indice: number, cambio: (actual: string) => string): void {
    setMessages((prev) => {
      const actual = prev[indice];
      if (!actual || actual.role !== "tutor") return prev;
      const next = [...prev];
      next[indice] = { role: "tutor", content: cambio(actual.content) };
      return next;
    });
  }

  async function ask(question: string, modo: ModoTutor = "NORMAL"): Promise<void> {
    if (!course || !question.trim() || enCursoRef.current) return;
    enCursoRef.current = true;
    setPending(true);

    // Cada respuesta escribe en su propia burbuja (por indice), no en "la ultima".
    const indice = messagesRef.current.length + 1;
    setMessages((prev) => [...prev, { role: "user", content: question }, { role: "tutor", content: "" }]);

    try {
      const sesionId = await obtenerSesion(course.id, modo);
      await askTutorStream(sesionId, question, (token) => {
        actualizarRespuesta(indice, (actual) => actual + token);
      }, modo);
    } catch {
      actualizarRespuesta(indice, (actual) =>
        actual || "No se pudo obtener respuesta del tutor en este momento. Intentalo de nuevo."
      );
    } finally {
      enCursoRef.current = false;
      setPending(false);
    }
  }

  return { messages, pending, ask };
}
