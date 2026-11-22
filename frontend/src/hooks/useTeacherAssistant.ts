import { useEffect, useRef, useState } from "react";
import {
  crearSesionDocente,
  downloadMaterialPdf,
  enviarMensajeDocente,
  exportMaterialPdf,
  listarMensajesDocente,
  listarSesionesDocente,
  type FuenteMaterial,
  type MensajeDocenteApi,
  type SesionDocenteApi,
} from "../services/teacherAI.service";

export interface MensajeAsistenteDocente {
  id: string | null;
  role: "user" | "assistant";
  content: string;
  sources: FuenteMaterial[];
}

function aMensajes(historial: MensajeDocenteApi[]): MensajeAsistenteDocente[] {
  return historial.map((m) => ({
    id: m.id,
    role: m.rol === "USER" ? "user" : "assistant",
    content: m.contenido,
    sources: m.sources ?? [],
  }));
}

function ultimaRespuesta(mensajes: MensajeAsistenteDocente[]): string | null {
  for (let i = mensajes.length - 1; i >= 0; i -= 1) {
    if (mensajes[i].role === "assistant" && mensajes[i].content) return mensajes[i].content;
  }
  return null;
}

export function useTeacherAssistant(materiaId?: string | null) {
  const [output, setOutput] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [pdfPending, setPdfPending] = useState(false);
  const [messages, setMessages] = useState<MensajeAsistenteDocente[]>([]);
  const [sesiones, setSesiones] = useState<SesionDocenteApi[]>([]);
  const [sesionActivaId, setSesionActivaId] = useState<string | null>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const sesionIdRef = useRef<string | null>(null);
  const cargaRef = useRef(0);
  const enCursoRef = useRef(false);

  useEffect(() => {
    let cancelado = false;
    const cargaId = ++cargaRef.current;
    sesionIdRef.current = null;
    setSesionActivaId(null);
    setMessages([]);
    setOutput(null);
    setSesiones([]);

    if (!materiaId) {
      setCargandoHistorial(false);
      return;
    }

    setCargandoHistorial(true);
    void (async () => {
      try {
        const lista = await listarSesionesDocente(materiaId);
        if (cancelado) return;
        setSesiones(lista);
        const ultima = lista.find((s) => !s.cerrada_en) ?? lista[0];
        if (!ultima) return;
        sesionIdRef.current = ultima.cerrada_en ? null : ultima.id;
        setSesionActivaId(ultima.id);
        const historial = await listarMensajesDocente(ultima.id);
        if (cancelado || cargaId !== cargaRef.current) return;
        const visibles = aMensajes(historial);
        setMessages(visibles);
        setOutput(ultimaRespuesta(visibles));
      } catch {
        if (!cancelado && cargaId === cargaRef.current) {
          setMessages([]);
          setOutput(null);
        }
      } finally {
        if (!cancelado && cargaId === cargaRef.current) setCargandoHistorial(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [materiaId]);

  useEffect(() => {
    if (!pending) return;
    const avisar = (e: BeforeUnloadEvent): void => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [pending]);

  async function obtenerSesion(materiaIdActual: string): Promise<string> {
    if (sesionIdRef.current) return sesionIdRef.current;
    const sesion = await crearSesionDocente(materiaIdActual);
    sesionIdRef.current = sesion.id;
    setSesionActivaId(sesion.id);
    setSesiones((prev) => [sesion, ...prev.filter((s) => s.id !== sesion.id)]);
    return sesion.id;
  }

  async function ask(
    prompt: string,
    materiaIdActual: string | null,
    classDate?: string,
    contentIds?: string[]
  ): Promise<void> {
    if (!prompt.trim() || enCursoRef.current) return;
    if (!materiaIdActual) {
      setOutput("Seleccioná una materia para poder generar material.");
      return;
    }

    enCursoRef.current = true;
    setPending(true);
    const indice = messages.length;
    setMessages((prev) => [
      ...prev,
      { id: null, role: "user", content: prompt, sources: [] },
      { id: null, role: "assistant", content: "", sources: [] },
    ]);

    try {
      const sesionId = await obtenerSesion(materiaIdActual);
      const respuesta = await enviarMensajeDocente(sesionId, {
        prompt,
        ...(classDate ? { class_date: classDate } : {}),
        ...(contentIds?.length ? { content_ids: contentIds } : {}),
      });
      setMessages((prev) => {
        const next = [...prev];
        next[indice] = { id: respuesta.id, role: "user", content: prompt, sources: [] };
        next[indice + 1] = {
          id: respuesta.id,
          role: "assistant",
          content: respuesta.contenido,
          sources: respuesta.sources,
        };
        return next;
      });
      setOutput(respuesta.contenido);
    } catch {
      setMessages((prev) => {
        const next = [...prev];
        next[indice + 1] = {
          id: null,
          role: "assistant",
          content: "No se pudo obtener respuesta del asistente. Intentá de nuevo.",
          sources: [],
        };
        return next;
      });
      setOutput(null);
    } finally {
      enCursoRef.current = false;
      setPending(false);
    }
  }

  async function seleccionarConversacion(id: string): Promise<void> {
    if (enCursoRef.current) return;
    const sesion = sesiones.find((s) => s.id === id);
    if (!sesion) return;
    const cargaId = ++cargaRef.current;
    sesionIdRef.current = sesion.cerrada_en ? null : id;
    setSesionActivaId(id);
    setCargandoHistorial(true);
    setMessages([]);
    setOutput(null);
    try {
      const historial = await listarMensajesDocente(id);
      if (cargaId !== cargaRef.current) return;
      const visibles = aMensajes(historial);
      setMessages(visibles);
      setOutput(ultimaRespuesta(visibles));
    } catch {
      if (cargaId === cargaRef.current) setMessages([]);
    } finally {
      if (cargaId === cargaRef.current) setCargandoHistorial(false);
    }
  }

  function nuevaConversacion(): void {
    if (enCursoRef.current) return;
    cargaRef.current += 1;
    sesionIdRef.current = null;
    setSesionActivaId(null);
    setMessages([]);
    setOutput(null);
    setCargandoHistorial(false);
  }

  async function downloadPdf(materiaIdActual: string | null, titulo?: string): Promise<void> {
    if (!output || !materiaIdActual) return;
    setPdfPending(true);
    try {
      downloadMaterialPdf(await exportMaterialPdf(output, materiaIdActual, titulo));
    } finally {
      setPdfPending(false);
    }
  }

  return {
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
  };
}
