/**
 * Reindexa en el RAG los contenidos existentes (texto y archivos).
 *
 * Uso:
 *   npm run rag:reindex                  -> todos los contenidos (salvo VIDEO)
 *   npm run rag:reindex -- --pendientes  -> solo los que tienen rag_indexado = false
 *
 * Va de a un contenido por vez: el ai-service ya paraleliza los embeddings de
 * cada documento y asi no se satura la cuota de Gemini.
 */
import "dotenv/config";
import { logger } from "../config/logger";
import { prisma } from "../config/prisma";
import { fuenteDeContenido, indexarAhora } from "../modules/contenidos/rag-indexer";

async function main(): Promise<void> {
  const soloPendientes = process.argv.includes("--pendientes");

  const contenidos = await prisma.contenido.findMany({
    where: {
      tipo: { not: "VIDEO" },
      ...(soloPendientes ? { rag_indexado: false } : {}),
    },
    include: { seccion: { select: { materia_id: true } } },
    orderBy: { created_at: "asc" },
  });

  logger.info({ total: contenidos.length, soloPendientes }, "Reindexado RAG: inicio");

  let ok = 0;
  const fallidos: string[] = [];

  for (const [i, contenido] of contenidos.entries()) {
    const etiqueta = `${i + 1}/${contenidos.length} ${contenido.tipo} "${contenido.titulo}"`;
    const fuente = await fuenteDeContenido(contenido);
    if (!fuente) {
      logger.warn({ contenidoId: contenido.id }, `${etiqueta}: sin texto ni archivo legible, se omite`);
      fallidos.push(contenido.id);
      continue;
    }

    const indexado = await indexarAhora(contenido.id, contenido.seccion.materia_id, fuente);
    if (indexado) {
      ok += 1;
      logger.info({ contenidoId: contenido.id }, `${etiqueta}: indexado`);
    } else {
      fallidos.push(contenido.id);
      logger.error({ contenidoId: contenido.id }, `${etiqueta}: FALLO`);
    }
  }

  logger.info({ ok, fallidos: fallidos.length, ids: fallidos }, "Reindexado RAG: fin");
  process.exitCode = fallidos.length > 0 ? 1 : 0;
}

main()
  .catch((err: unknown) => {
    logger.error({ err }, "Reindexado RAG abortado");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
