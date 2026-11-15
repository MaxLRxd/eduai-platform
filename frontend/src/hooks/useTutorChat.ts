import { useEffect, useRef, useState } from "react";
import type { Course, TutorMessage } from "../types/domain";
import {
  askTutorStream,
  createTutorSession,
  getTutorMessages,
  listTutorSessions,
  type ModoTutor,
  type SesionApi,
  type TutorMensaje,
} from "../services/tutor.service";

// CU-A04 (A7): si la primera palabra no llega en este tiempo se avisa y se ofrece reintentar.
export const TUTOR_LENTO_MS = 10_000;

function aMensajes(historial: TutorMensaje[]): TutorMessage[] {
  return historial.map((m) => ({
    role: m.rol === "USER" ? "user" : "tutor",
    content: m.contenido,
  }));
}

const CLAVE_ULTIMA_SESION = "tutor:ultima-sesion:";

function leerUltimaSesion(materiaId: string): string | null {
  try {
    return window.localStorage.getItem(`${CLAVE_ULTIMA_SESION}${materiaId}`);
  } catch {
    return null;
  }
}

function guardarUltimaSesion(materiaId: string, sesionId: string | null): void {
  try {
    if (sesionId) {
      window.localStorage.setItem(`${CLAVE_ULTIMA_SESION}${materiaId}`, sesionId);
    } else {
      window.localStorage.removeItem(`${CLAVE_ULTIMA_SESION}${materiaId}`);
    }
  } catch {
    // sin localStorage simplemente se retoma la conversación más reciente
  }
}

export function useTutorChat(course: Course | undefined) {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [lenta, setLenta] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [sesiones, setSesiones] = useState<SesionApi[]>([]);
  const [sesionActivaId, setSesionActivaId] = useState<string | null>(null);
  const [sesionCerrada, setSesionCerrada] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const reintentarRef = useRef(false);
  const ultimaRef = useRef<{ question: string; modo: ModoTutor } | null>(null);
  const sesionIdRef = useRef<string | null>(null);
  // Descarta cargas de historial que quedaron viejas si el alumno cambia rápido de conversación.
  const cargaRef = useRef(0);
  // Ref y no solo estado: dos clicks seguidos llegan antes de que React
  // re-renderice con pending=true, y cada uno abria su propio streaming que
  // escribia tokens mezclados en la misma burbuja.
  const enCursoRef = useRef(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Al entrar a una materia se retoma la conversación abierta más reciente y se
  // mantiene la lista completa para poder volver a conversaciones anteriores.
  // El backend ya guarda cada mensaje por alumno, así que el historial es privado.
  useEffect(() => {
    sesionIdRef.current = null;
    setSesionActivaId(null);
    setSesionCerrada(false);
    setSesiones([]);
    setMessages([]);
    setCargandoHistorial(false);
    if (!course?.id) return;

    let cancelado = false;
    const cargaId = ++cargaRef.current;
    setCargandoHistorial(true);

    void (async () => {
      try {
        const todas = await listTutorSessions();
        if (cancelado) return;

        const deMateria = todas.filter((s) => s.materia_id === course.id);
        // Si se alcanzó a crear una sesión nueva mientras llegaba esta lista, no se descarta.
        setSesiones((prev) => {
          const porId = new Map(deMateria.map((s) => [s.id, s]));
          for (const s of prev) {
            if (!porId.has(s.id)) porId.set(s.id, s);
          }
          return [...porId.values()];
        });

        const ultima = leerUltimaSesion(course.id);
        const guardada = deMateria.find((s) => s.id === ultima && !s.cerrada_en);
        const sesion = guardada ?? deMateria.find((s) => !s.cerrada_en) ?? deMateria[0];
        if (!sesion || cancelado || sesionIdRef.current) return;

        setSesionActivaId(sesion.id);
        setSesionCerrada(Boolean(sesion.cerrada_en));
        sesionIdRef.current = sesion.cerrada_en ? null : sesion.id;
        guardarUltimaSesion(course.id, sesion.cerrada_en ? null : sesion.id);

        const historial = await getTutorMessages(sesion.id);
        if (
          cancelado ||
          cargaId !== cargaRef.current ||
          messagesRef.current.length > 0 ||
          sesionIdRef.current !== sesion.id
        ) {
          return;
        }

        setMessages(aMensajes(historial));
      } catch {
        // Sin historial disponible se arranca una conversación nueva.
      } finally {
        if (!cancelado && cargaId === cargaRef.current) setCargandoHistorial(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [course?.id]);

  async function obtenerSesion(materiaId: string, modo: ModoTutor): Promise<string> {
    if (sesionIdRef.current) return sesionIdRef.current;
    const id = await createTutorSession(materiaId, modo);
    sesionIdRef.current = id;
    setSesionActivaId(id);
    setSesionCerrada(false);
    guardarUltimaSesion(materiaId, id);
    setSesiones((prev) => [
      {
        id,
        materia_id: materiaId,
        modo,
        iniciada_en: new Date().toISOString(),
        cerrada_en: null,
        mensajes: 0,
      },
      ...prev.filter((s) => s.id !== id),
    ]);
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
    if (!course || !question.trim() || enCursoRef.current || sesionCerrada) return;
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

  /** Abre una conversación anterior sin borrarla ni crear una sesión nueva. */
  function seleccionarConversacion(id: string): void {
    if (enCursoRef.current) return;
    const sesion = sesiones.find((s) => s.id === id);
    if (!sesion) return;

    const cargaId = ++cargaRef.current;
    setSesionActivaId(id);
    setSesionCerrada(Boolean(sesion.cerrada_en));
    sesionIdRef.current = sesion.cerrada_en ? null : id;
    guardarUltimaSesion(sesion.materia_id, sesion.cerrada_en ? null : id);
    setMessages([]);
    setCargandoHistorial(true);

    void (async () => {
      try {
        const historial = await getTutorMessages(id);
        if (cargaId !== cargaRef.current) return;
        setMessages(aMensajes(historial));
      } catch {
        if (cargaId === cargaRef.current) setMessages([]);
      } finally {
        if (cargaId === cargaRef.current) setCargandoHistorial(false);
      }
    })();
  }

  /** Arranca una conversación nueva sin borrar el historial guardado en el backend. */
  function nuevaConversacion(): void {
    if (enCursoRef.current) return;
    cargaRef.current += 1;
    sesionIdRef.current = null;
    ultimaRef.current = null;
    if (course?.id) guardarUltimaSesion(course.id, null);
    setSesionActivaId(null);
    setSesionCerrada(false);
    setMessages([]);
    setLenta(false);
    setCargandoHistorial(false);
  }

  return {
    messages,
    pending,
    lenta,
    cargandoHistorial,
    sesiones,
    sesionActivaId,
    sesionCerrada,
    ask,
    reintentar,
    nuevaConversacion,
    seleccionarConversacion,
  };
}
