import { api, API_URL } from "./api";
import { getAccessToken } from "./authToken";

export type ModoTutor = "NORMAL" | "SOCRATIC" | "HINTS";

interface SesionApi {
  id: string;
  materia_id: string;
  modo: string;
  iniciada_en: string;
  cerrada_en: string | null;
  mensajes: number;
}

// POST /api/materias/:materiaId/tutor/sesiones — inicia una sesión de tutor.
export async function createTutorSession(materiaId: string, modo: ModoTutor = "NORMAL"): Promise<string> {
  const data = await api<{ sesion: SesionApi }>(`/api/materias/${materiaId}/tutor/sesiones`, {
    method: "POST",
    body: JSON.stringify({ modo }),
  });
  return data.sesion.id;
}

export interface TutorMensaje {
  id: string;
  rol: "USER" | "ASSISTANT";
  contenido: string;
  creado_en: string;
}

export interface AskTutorResult {
  pregunta: TutorMensaje;
  respuesta: {
    contenido: string;
    sources: { material_id: string; chunk_index: number; content: string; score: number }[];
    prompt_depurado: string | null;
    cached: boolean;
  };
}

// POST /api/tutor/sesiones/:sesionId/mensajes — envía una pregunta y devuelve la respuesta.
export async function askTutor(
  sesionId: string,
  question: string,
  modo?: ModoTutor
): Promise<AskTutorResult> {
  const data = await api<AskTutorResult>(
    `/api/tutor/sesiones/${sesionId}/mensajes`,
    {
      method: "POST",
      body: JSON.stringify({ contenido: question, ...(modo ? { modo } : {}) }),
    }
  );
  return data;
}

// GET /api/tutor/sesiones/:sesionId/mensajes — historial de la sesión.
export async function getTutorMessages(sesionId: string): Promise<TutorMensaje[]> {
  const data = await api<{ mensajes: TutorMensaje[] }>(`/api/tutor/sesiones/${sesionId}/mensajes`);
  return data.mensajes ?? [];
}

// POST /api/tutor/sesiones/:sesionId/stream — SSE con tokens incrementales.
export async function askTutorStream(
  sesionId: string,
  question: string,
  onToken: (token: string) => void,
  modo?: ModoTutor
): Promise<string> {
  const token = getAccessToken();

  const res = await fetch(`${API_URL}/api/tutor/sesiones/${sesionId}/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ contenido: question, ...(modo ? { modo } : {}) }),
    credentials: "include",
  });

  if (!res.ok || !res.body) {
    throw new Error("No se pudo iniciar el streaming del tutor");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let respuesta = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lineas = buffer.split("\n");
    buffer = lineas.pop() ?? "";
    for (const linea of lineas) {
      const line = linea.trim();
      if (!line.startsWith("data:")) continue;
      try {
        const payload = JSON.parse(line.slice(5).trim()) as { type?: string; text?: string };
        if (payload.type === "token" && payload.text) {
          respuesta += payload.text;
          onToken(payload.text);
        }
      } catch {
        // ignora eventos no parseables
      }
    }
  }

  return respuesta;
}

export interface ResumenResult {
  resumen: string;
  origen: string | null;
  max_palabras: number;
}

// POST /api/materias/:materiaId/tutor/resumen — CU-A05.
export async function resumirMaterial(
  materiaId: string,
  input: { contenido_id?: string; texto?: string; idioma?: string; max_palabras?: number }
): Promise<ResumenResult> {
  return api<ResumenResult>(`/api/materias/${materiaId}/tutor/resumen`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type DificultadExamen = "facil" | "media" | "dificil";

export interface ExamenPregunta {
  tipo: "multiple_choice" | "desarrollo";
  enunciado: string;
  opciones: string[];
  respuesta: string;
}

export interface ExamenResult {
  titulo: string;
  dificultad: string;
  preguntas: ExamenPregunta[];
}

// POST /api/materias/:materiaId/tutor/examen — CU-A08.
export async function generarSimulacro(
  materiaId: string,
  input: { n_preguntas?: number; dificultad?: DificultadExamen }
): Promise<ExamenResult> {
  return api<ExamenResult>(`/api/materias/${materiaId}/tutor/examen`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}