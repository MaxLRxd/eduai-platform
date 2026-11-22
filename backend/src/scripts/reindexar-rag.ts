/**
 * Reindexa en el RAG los contenidos existentes (texto y archivos).
 *
 * Uso:
 *   npm run rag:reindex                  -> todos los contenidos (salvo VIDEO)
 *   npm run rag:reindex -- --pendientes  -> solo los que tienen rag_indexado = false
 *   npm run rag:reindex -- --planning    -> crea/e indexa los materiales subidos desde Planificacion
 *   npm run rag:reindex -- --huerfanos   -> solo borra del almacen vectorial las materias que ya no
 *                                           existen en la base (no reindexa nada)
 *   npm run rag:reindex -- --limpiar     -> borra el material indexado de cada materia y lo reindexa
 *                                           a limpio (usar al cambiar de VECTOR_STORE o de embeddings)
 *
 * Para cambiar de almacen vectorial: cambiar VECTOR_STORE, reiniciar el ai-service y correr
 * `npm run rag:reindex`. Los vectores del almacen anterior NO se migran ni se borran solos.
 *
 * Va de a un contenido por vez: el ai-service ya paraleliza los embeddings de
 * cada documento y asi no se satura la cuota de Gemini.
 */
import "dotenv/config";
import { borrarMateriaIndexadaIA, listarMateriasIndexadasIA } from "../config/aiClient";
import { logger } from "../config/logger";
import { prisma } from "../config/prisma";
import { leerArchivo } from "../config/storage";
import { inferirTipo } from "../modules/contenidos/contenidos.service";
import { fuenteDeContenido, indexarAhora } from "../modules/contenidos/rag-indexer";
import type { FuenteRag } from "../modules/contenidos/rag-indexer";
import { materiasHuerfanas } from "../modules/contenidos/rag-limpieza";

/** Borra del almacen vectorial las materias que ya no existen en la base. Devuelve cuantas borro. */
async function borrarHuerfanas(): Promise<number> {
  const indexadas = await listarMateriasIndexadasIA();
  if (!indexadas) {
    throw new Error("No se pudo consultar el almacen vectorial (¿esta levantado el ai-service?)");
  }
  const vigentes = (await prisma.materia.findMany({ select: { id: true } })).map((m) => m.id);
  const huerfanas = materiasHuerfanas(indexadas, vigentes);

  for (const materia of huerfanas) {
    const borrada = await borrarMateriaIndexadaIA(materia.subject_id);
    logger.info(
      { materiaId: materia.subject_id, fragmentos: materia.fragmentos },
      borrada ? "Materia huerfana borrada del almacen vectorial" : "No se pudo borrar la materia huerfana"
    );
  }
  logger.info({ huerfanas: huerfanas.length }, "Limpieza de huerfanas: fin");
  return huerfanas.length;
}

async function backfillMaterialesDePlanning(): Promise<void> {
  const clases = await prisma.planningClase.findMany({
    where: { material_url: { not: null } },
    orderBy: { fecha_clase: "asc" },
  });

  let creados = 0;
  const fallidos: string[] = [];

  for (const clase of clases) {
    if (!clase.material_url) continue;
    const yaIndexado = await prisma.contenido.findFirst({
      where: { clase_id: clase.id, archivo_url: clase.material_url },
      select: { id: true },
    });
    if (yaIndexado) continue;

    let seccionId = clase.seccion_id;
    if (!seccionId) {
      const primera = await prisma.seccion.findFirst({
        where: { materia_id: clase.materia_id },
        orderBy: { orden: "asc" },
        select: { id: true },
      });
      if (!primera) {
        logger.warn({ claseId: clase.id }, "Planning sin unidad ni seccion en la materia; se omite");
        fallidos.push(clase.id);
        continue;
      }
      seccionId = primera.id;
      await prisma.planningClase.update({ where: { id: clase.id }, data: { seccion_id: seccionId } });
    }

    const nombre = clase.material_nombre ?? clase.material_url.split("/").pop() ?? clase.titulo;
    const buffer = await leerArchivo(clase.material_url);
    if (!buffer) {
      logger.warn(
        { claseId: clase.id, url: clase.material_url },
        "Material de planning sin archivo accesible; se omite"
      );
      fallidos.push(clase.id);
      continue;
    }
    const fuente: FuenteRag = { tipo: "archivo", buffer, nombre };
    let contenidoId: string | null = null;
    try {
      const contenido = await prisma.contenido.create({
        data: {
          seccion_id: seccionId,
          clase_id: clase.id,
          tipo: inferirTipo(nombre),
          titulo: nombre.replace(/\.[^.]+$/, "").slice(0, 200),
          archivo_url: clase.material_url,
          archivo_nombre: nombre,
          archivo_formato: clase.material_formato,
          archivo_tamano_kb: clase.material_tamano_kb,
        },
      });
      contenidoId = contenido.id;
      if (!(await indexarAhora(contenido.id, clase.materia_id, fuente))) {
        await prisma.contenido.delete({ where: { id: contenido.id } });
        fallidos.push(contenido.id);
        continue;
      }
      creados += 1;
    } catch (err) {
      if (contenidoId) {
        await prisma.contenido.deleteMany({ where: { id: contenidoId } });
      }
      logger.warn({ err, claseId: clase.id }, "No se pudo migrar el material de planning al RAG");
      fallidos.push(clase.id);
    }
  }

  logger.info({ creados, fallidos: fallidos.length }, "Backfill de materiales de planning: fin");
  process.exitCode = fallidos.length > 0 ? 1 : 0;
}

async function main(): Promise<void> {
  const soloPendientes = process.argv.includes("--pendientes");

  if (process.argv.includes("--planning")) {
    await backfillMaterialesDePlanning();
    return;
  }

  if (process.argv.includes("--huerfanos")) {
    await borrarHuerfanas();
    return;
  }

  if (process.argv.includes("--limpiar")) {
    await borrarHuerfanas();
    const materias = await prisma.materia.findMany({ select: { id: true } });
    for (const { id } of materias) {
      await borrarMateriaIndexadaIA(id);
    }
    logger.info({ materias: materias.length }, "Material indexado borrado: se reindexa a limpio");
  }

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
