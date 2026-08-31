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
