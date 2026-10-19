import http from "node:http";
import https from "node:https";
import { env } from "./env";
import { logger } from "./logger";
import { prisma } from "./prisma";

function baseUrl(): string {
  return (env.AI_SERVICE_URL ?? "").replace(/\/+$/, "");
}

function aiDisponible(): boolean {
  return Boolean(env.AI_SERVICE_URL);
}

/**
 * id -> titulo de los contenidos de la materia. El ai-service rotula con esto
 * los fragmentos del RAG; sin el mapa, el LLM citaba el UUID del material.
 */
async function titulosDeMateria(materiaId: string): Promise<Record<string, string>> {
  try {
    const contenidos = await prisma.contenido.findMany({
      where: { seccion: { materia_id: materiaId } },
      select: { id: true, titulo: true },
    });
    return Object.fromEntries(contenidos.map((c) => [c.id, c.titulo]));
  } catch (err) {
    logger.warn({ err, materiaId }, "No se pudieron obtener los titulos de los materiales");
    return {};
  }
}

export interface IndexMaterialResult {
  material_id: string;
  chunks: number;
  indexed: boolean;
}

// Tope de seguridad para un indexado: un PDF grande puede llevar muchos minutos
// (una llamada de embedding por chunk, con reintentos ante 429/503).
const INDEXADO_TIMEOUT_MS = 2 * 60 * 60 * 1000;

/**
 * POST al ai-service sin los timeouts de `fetch`. El fetch de Node (undici)
 * corta a los 5 minutos si no llegan los headers de la respuesta, y el
 * ai-service no responde hasta terminar de embeber todo el documento.
 */
async function postLargo(
  ruta: string,
  body: Buffer,
  contentType: string
): Promise<{ status: number; texto: string }> {
  const url = new URL(`${baseUrl()}${ruta}`);
  const cliente = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = cliente.request(
      url,
      {
        method: "POST",
        headers: { "Content-Type": contentType, "Content-Length": body.length },
        timeout: INDEXADO_TIMEOUT_MS,
      },
      (res) => {
        const partes: Buffer[] = [];
        res.on("data", (parte: Buffer) => partes.push(parte));
        res.on("end", () =>
          resolve({ status: res.statusCode ?? 0, texto: Buffer.concat(partes).toString("utf8") })
        );
        res.on("error", reject);
      }
    );
    req.on("timeout", () => req.destroy(new Error("Timeout del indexado en ai-service")));
    req.on("error", reject);
    req.end(body);
  });
}

async function postIndexado(
  ruta: string,
  body: Buffer,
  contentType: string,
  materialId: string
): Promise<IndexMaterialResult | null> {
  try {
    const { status, texto } = await postLargo(ruta, body, contentType);
    if (status < 200 || status >= 300) {
      logger.error(
        { status, materialId, detalle: texto.slice(0, 500) },
        "Fallo al indexar material en ai-service"
      );
      return null;
    }
    return JSON.parse(texto) as IndexMaterialResult;
  } catch (err) {
    logger.error({ err, materialId }, "Error al comunicarse con ai-service para indexar");
    return null;
  }
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

  const form = new FormData();
  form.append("subject_id", subjectId);
  form.append("material_id", materialId);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  form.append("archivo", new Blob([arrayBuffer]), filename);

  // Response serializa el multipart (con su boundary) a un buffer.
  const serializado = new Response(form);
  const body = Buffer.from(await serializado.arrayBuffer());
  const contentType = serializado.headers.get("content-type") ?? "multipart/form-data";

  return postIndexado("/rag/material/archivo", body, contentType, materialId);
}

export async function eliminarMaterialRag(subjectId: string, materialId: string): Promise<void> {
  if (!aiDisponible()) return;

  try {
    const res = await fetch(
      `${baseUrl()}/rag/material/${encodeURIComponent(subjectId)}/${encodeURIComponent(materialId)}`,
      { method: "DELETE", signal: AbortSignal.timeout(30_000) }
    );
    if (!res.ok) {
      logger.error({ status: res.status, materialId }, "Fallo al eliminar material del RAG");
    }
  } catch (err) {
    logger.error({ err, materialId }, "Error al comunicarse con ai-service para eliminar material");
  }
}

export interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

export interface TutorResult {
  answer: string;
  mode: "normal" | "socratic" | "hints";
  sources: { material_id: string; titulo?: string | null; chunk_index: number; content: string; score: number }[];
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
      body: JSON.stringify({
        subject_id: subjectId,
        question,
        mode,
        history,
        material_titles: await titulosDeMateria(subjectId),
      }),
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
      body: JSON.stringify({
        subject_id: subjectId,
        question,
        mode,
        history,
        material_titles: await titulosDeMateria(subjectId),
      }),
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
  if (!text.trim()) return null;
  if (!aiDisponible()) {
    logger.warn("AI_SERVICE_URL no configurado; material no indexado para RAG");
    return null;
  }

  const body = Buffer.from(
    JSON.stringify({ subject_id: subjectId, material_id: materialId, text }),
    "utf8"
  );
  return postIndexado("/rag/material", body, "application/json", materialId);
}

export interface MaterialDocenteResult {
  material: string;
  sources: { material_id: string; titulo?: string | null; chunk_index: number; content: string; score: number }[];
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
      body: JSON.stringify({
        subject_id: subjectId,
        prompt,
        material_titles: await titulosDeMateria(subjectId),
      }),
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
