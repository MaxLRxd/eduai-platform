import type { TipoContenido } from "@prisma/client";
import { eliminarMaterialRag, indexArchivo, indexMaterial } from "../../config/aiClient";
import { logger } from "../../config/logger";
import { prisma } from "../../config/prisma";
import { leerArchivo } from "../../config/storage";

export type FuenteRag =
  | { tipo: "texto"; texto: string }
  | { tipo: "archivo"; buffer: Buffer; nombre: string };

// Ultima version de indexado pedida por contenido: si el profesor edita el
// contenido mientras se indexa la version anterior, el resultado viejo no pisa
// el estado de la nueva.
const versiones = new Map<string, number>();
const enCurso = new Set<Promise<boolean>>();

async function ejecutar(
  contenidoId: string,
  materiaId: string,
  fuente: FuenteRag,
  version?: number
): Promise<boolean> {
  const inicio = Date.now();
  const resultado =
    fuente.tipo === "texto"
      ? await indexMaterial(materiaId, contenidoId, fuente.texto)
      : await indexArchivo(materiaId, contenidoId, fuente.buffer, fuente.nombre);
  const indexado = resultado?.indexed ?? false;

  if (version !== undefined && versiones.get(contenidoId) !== version) {
    return indexado;
  }
  versiones.delete(contenidoId);

  // updateMany no falla si el contenido se borro durante el indexado.
  const { count } = await prisma.contenido.updateMany({
    where: { id: contenidoId },
    data: { rag_indexado: indexado },
  });
  if (count === 0 && indexado) {
    // Se borro mientras se indexaba: no dejar chunks huerfanos en el RAG.
    await eliminarMaterialRag(materiaId, contenidoId);
    return false;
  }

  logger.info(
    { contenidoId, indexado, chunks: resultado?.chunks ?? 0, duracionMs: Date.now() - inicio },
    "Indexado RAG finalizado"
  );
  return indexado;
}

/**
 * Indexa sin bloquear la respuesta HTTP: un PDF grande puede tardar varios
 * minutos (una llamada de embedding por chunk). `rag_indexado` pasa a true
 * cuando termina.
 */
export function indexarEnSegundoPlano(
  contenidoId: string,
  materiaId: string,
  fuente: FuenteRag
): void {
  const version = (versiones.get(contenidoId) ?? 0) + 1;
  versiones.set(contenidoId, version);

  const tarea = ejecutar(contenidoId, materiaId, fuente, version).catch((err: unknown) => {
    logger.error({ err, contenidoId }, "Error inesperado al indexar contenido en el RAG");
    return false;
  });
  enCurso.add(tarea);
  void tarea.finally(() => enCurso.delete(tarea));
}

/** Indexa esperando el resultado (usado por el reindexado masivo). */
export function indexarAhora(
  contenidoId: string,
  materiaId: string,
  fuente: FuenteRag
): Promise<boolean> {
  return ejecutar(contenidoId, materiaId, fuente);
}

/** Espera los indexados en curso (tests y apagado ordenado). */
export async function esperarIndexadosEnCurso(): Promise<void> {
  await Promise.allSettled([...enCurso]);
}

/** Arma la fuente a indexar de un contenido ya guardado, o null si no aplica. */
export async function fuenteDeContenido(contenido: {
  tipo: TipoContenido;
  texto_contenido: string | null;
  archivo_url: string | null;
  archivo_nombre: string | null;
}): Promise<FuenteRag | null> {
  if (contenido.tipo === "VIDEO") return null;

  if (contenido.texto_contenido?.trim()) {
    return { tipo: "texto", texto: contenido.texto_contenido };
  }

  const buffer = await leerArchivo(contenido.archivo_url);
  if (!buffer) return null;
  return {
    tipo: "archivo",
    buffer,
    nombre: contenido.archivo_nombre ?? contenido.archivo_url?.split("/").pop() ?? "archivo",
  };
}
