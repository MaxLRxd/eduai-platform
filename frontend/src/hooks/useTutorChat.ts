import { useEffect, useRef, useState } from "react";
import type { Course, TutorMessage } from "../types/domain";
import { askTutorStream, createTutorSession, type ModoTutor } from "../services/tutor.service";

// CU-A04 (A7): si la primera palabra no llega en este tiempo se avisa y se ofrece reintentar.
export const TUTOR_LENTO_MS = 10_000;

export function useTutorChat(course: Course | undefined) {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [lenta, setLenta] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const reintentarRef = useRef(false);
  const ultimaRef = useRef<{ question: string; modo: ModoTutor } | null>(null);
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
    ultimaRef.current = { question, modo };

    const controller = new AbortController();
    abortRef.current = controller;
    let recibioTexto = false;
    const temporizador = window.setTimeout(() => {
      if (!recibioTexto) setLenta(true);
    }, TUTOR_LENTO_MS);

    // Cada respuesta escribe en su propia burbuja (por indice), no en "la ultima".
    const indice = messagesRef.current.length + 1;
    setMessages((prev) => [...prev, { role: "user", content: question }, { role: "tutor", content: "" }]);

    try {
      const sesionId = await obtenerSesion(course.id, modo);
      await askTutorStream(
        sesionId,
        question,
        (token) => {
          if (!recibioTexto) {
            recibioTexto = true;
            setLenta(false);
          }
          actualizarRespuesta(indice, (actual) => actual + token);
        },
        modo,
        controller.signal
      );
    } catch {
      if (!reintentarRef.current) {
        actualizarRespuesta(indice, (actual) =>
          actual || "No se pudo obtener respuesta del tutor en este momento. Intentalo de nuevo."
        );
      }
    } finally {
      window.clearTimeout(temporizador);
      enCursoRef.current = false;
      setPending(false);
      setLenta(false);

      if (reintentarRef.current) {
        // Se descarta el intercambio cortado y se vuelve a preguntar lo mismo.
        reintentarRef.current = false;
        messagesRef.current = messagesRef.current.slice(0, indice - 1);
        setMessages((prev) => prev.slice(0, indice - 1));
        void ask(question, modo);
      }
    }
  }

  /** Corta la consulta en curso (si el tutor tarda demasiado) y la envia de nuevo. */
  function reintentar(): void {
    if (!enCursoRef.current || !ultimaRef.current) return;
    reintentarRef.current = true;
    abortRef.current?.abort();
  }

  return { messages, pending, lenta, ask, reintentar };
}
