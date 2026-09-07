import { api } from "./api";

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
export async function askTutor(sesionId: string, question: string): Promise<AskTutorResult> {
  const data = await api<AskTutorResult>(
    `/api/tutor/sesiones/${sesionId}/mensajes`,
    {
      method: "POST",
      body: JSON.stringify({ contenido: question }),
    }
  );
  return data;
}

// GET /api/tutor/sesiones/:sesionId/mensajes — historial de la sesión.
export async function getTutorMessages(sesionId: string): Promise<TutorMensaje[]> {
  const data = await api<{ mensajes: TutorMensaje[] }>(`/api/tutor/sesiones/${sesionId}/mensajes`);
  return data.mensajes ?? [];
}