import { env } from "./env";
import { logger } from "./logger";

function baseUrl(): string {
  return (env.AI_SERVICE_URL ?? "").replace(/\/+$/, "");
}

function aiDisponible(): boolean {
  return Boolean(env.AI_SERVICE_URL);
}

export interface IndexMaterialResult {
  material_id: string;
  chunks: number;
  indexed: boolean;
}

export async function indexArchivo(
  subjectId: string,
  materialId: string,
  buffer: Buffer,
  filename: string
): Promise<IndexMaterialResult | null> {
  if (!aiDisponible()) {
    logger.warn("AI_SERVICE_URL no configurado; archivo no indexado para RAG");
    return null;
  }

  try {
    const form = new FormData();
    form.append("subject_id", subjectId);
    form.append("material_id", materialId);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    form.append("archivo", new Blob([arrayBuffer]), filename);

    const res = await fetch(`${baseUrl()}/rag/material/archivo`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(90_000),
    });

    if (!res.ok) {
      logger.error({ status: res.status }, "Fallo al indexar archivo en ai-service");
      return null;
    }

    return (await res.json()) as IndexMaterialResult;
  } catch (err) {
    logger.error({ err }, "Error al comunicarse con ai-service para indexar archivo");
    return null;
  }
}

export interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

export interface TutorResult {
  answer: string;
  mode: "normal" | "socratic" | "hints";
  sources: { material_id: string; chunk_index: number; content: string; score: number }[];
  prompt_depurado: string | null;
  tokens_ahorrados: number;
  cached: boolean;
}

export async function chatTutor(
  subjectId: string,
  question: string,
  mode: "normal" | "socratic" | "hints",
  history: ChatMessageInput[]
): Promise<TutorResult | null> {
  if (!aiDisponible()) {
    logger.warn("AI_SERVICE_URL no configurado; no se pudo obtener respuesta del tutor");
    return null;
  }

  try {
    const res = await fetch(`${baseUrl()}/tutor/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_id: subjectId, question, mode, history }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      logger.error({ status: res.status }, "Fallo al consultar el tutor en ai-service");
      return null;
    }

    return (await res.json()) as TutorResult;
  } catch (err) {
    logger.error({ err }, "Error al comunicarse con ai-service para el tutor");
    return null;
  }
}

export async function streamTutor(
  subjectId: string,
  question: string,
  mode: "normal" | "socratic" | "hints",
  history: ChatMessageInput[]
): Promise<Response | null> {
  if (!aiDisponible()) {
    logger.warn("AI_SERVICE_URL no configurado; no se pudo transmitir la respuesta del tutor");
    return null;
  }

  try {
    return await fetch(`${baseUrl()}/tutor/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_id: subjectId, question, mode, history }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (err) {
    logger.error({ err }, "Error al comunicarse con ai-service para el streaming del tutor");
    return null;
  }
}

export async function indexMaterial(
  subjectId: string,
  materialId: string,
  text: string
): Promise<IndexMaterialResult | null> {
  if (!aiDisponible() || !text.trim()) {
    logger.warn("AI_SERVICE_URL no configurado; material no indexado para RAG");
    return null;
  }

  try {
    const res = await fetch(`${baseUrl()}/rag/material`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_id: subjectId, material_id: materialId, text }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      logger.error({ status: res.status }, "Fallo al indexar material en ai-service");
      return null;
    }

    return (await res.json()) as IndexMaterialResult;
  } catch (err) {
    logger.error({ err }, "Error al comunicarse con ai-service para indexar");
    return null;
  }
}

export interface MaterialDocenteResult {
  material: string;
  sources: { material_id: string; chunk_index: number; content: string; score: number }[];
}

export async function generarMaterialDocente(
  subjectId: string,
  prompt: string
): Promise<MaterialDocenteResult | null> {
  if (!aiDisponible()) {
    logger.warn("AI_SERVICE_URL no configurado; no se pudo generar material docente");
    return null;
  }

  try {
    const res = await fetch(`${baseUrl()}/tutor/generar-material`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_id: subjectId, prompt }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      logger.error({ status: res.status }, "Fallo al generar material en ai-service");
      return null;
    }

    return (await res.json()) as MaterialDocenteResult;
  } catch (err) {
    logger.error({ err }, "Error al comunicarse con ai-service para generar material");
    return null;
  }
}

export interface CorreccionIARequest {
  subject_id: string;
  material_id: string | null;
  consigna: string;
  entrega: string;
  rubrica: unknown;
}

export interface CorreccionIAResult {
  feedback: string;
  calificacion: number;
}
export async function corregirEntregaIA(input: CorreccionIARequest): Promise<CorreccionIAResult | null> {
  if (!aiDisponible()) {
    logger.warn("AI_SERVICE_URL no configurado; no se pudo corregir la entrega con IA");
    return null;
  }

  try {
    const res = await fetch(`${baseUrl()}/tutor/corregir-entrega`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject_id: input.subject_id,
        material_id: input.material_id,
        consigna: input.consigna,
        entrega: input.entrega,
        rubrica: Array.isArray(input.rubrica) ? input.rubrica : [],
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      logger.error({ status: res.status }, "Fallo al corregir la entrega en ai-service");
      return null;
    }

    return (await res.json()) as CorreccionIAResult;
  } catch (err) {
    logger.error({ err }, "Error al comunicarse con ai-service para corregir");
    return null;
  }
}

export interface ResumenIAResult {
  summary: string;
}

export async function resumirDocumento(
  text: string,
  language: string,
  maxWords: number
): Promise<ResumenIAResult | null> {
  if (!aiDisponible()) {
    logger.warn("AI_SERVICE_URL no configurado; no se pudo resumir el documento");
    return null;
  }

  try {
    const res = await fetch(`${baseUrl()}/tutor/resumen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language, max_words: maxWords }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      logger.error({ status: res.status }, "Fallo al resumir el documento en ai-service");
      return null;
    }

    return (await res.json()) as ResumenIAResult;
  } catch (err) {
    logger.error({ err }, "Error al comunicarse con ai-service para resumir");
    return null;
  }
}

export type DificultadExamen = "facil" | "media" | "dificil";

export interface ExamenPregunta {
  tipo: "multiple_choice" | "desarrollo";
  enunciado: string;
  opciones: string[];
  respuesta: string;
}

export interface ExamenIAResult {
  titulo: string;
  dificultad: string;
  preguntas: ExamenPregunta[];
}

export async function generarExamen(
  subjectId: string,
  nQuestions: number,
  difficulty: DificultadExamen
): Promise<ExamenIAResult | null> {
  if (!aiDisponible()) {
    logger.warn("AI_SERVICE_URL no configurado; no se pudo generar el simulacro");
    return null;
  }

  try {
    const res = await fetch(`${baseUrl()}/tutor/examen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject_id: subjectId, n_questions: nQuestions, difficulty }),
      signal: AbortSignal.timeout(180_000),
    });

    if (!res.ok) {
      logger.error({ status: res.status }, "Fallo al generar el simulacro en ai-service");
      return null;
    }

    return (await res.json()) as ExamenIAResult;
  } catch (err) {
    logger.error({ err }, "Error al comunicarse con ai-service para generar el simulacro");
    return null;
  }
}
