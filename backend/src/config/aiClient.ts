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

export interface CorreccionIARequest {
  subject_id: string;
  material_id: string | null;
  entrega: string;
  rubrica: unknown;
}

export interface CorreccionIAResult {
  feedback: string;
  calificacion: number;
}

export async function corregirEntregaIA(
  _input: CorreccionIARequest
): Promise<CorreccionIAResult | null> {
  // TODO: conectar con el endpoint de correccion del ai-service (correct_submission)
  // cuando exista. Por ahora es un stub: el flujo queda preparado sin llamar al LLM.
  return null;
}
