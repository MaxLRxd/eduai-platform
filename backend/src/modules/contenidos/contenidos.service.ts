import type { Rol, TipoContenido } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import { eliminarMaterialRag } from "../../config/aiClient";
import { eliminarArchivo, guardarArchivo } from "../../config/storage";
import { indexarEnSegundoPlano } from "./rag-indexer";
import {
  obtenerInscripcion,
  obtenerProfesorAsignado,
} from "../materias/materias.service";
import type {
  ActualizarContenidoInput,
  CrearContenidoInput,
} from "./contenidos.schemas";

const EXTENSIONES: Record<string, TipoContenido> = {
  pdf: "PDF",
  docx: "DOCX",
  doc: "DOCX",
  pptx: "PPTX",
  ppt: "PPTX",
  txt: "TEXTO",
  md: "TEXTO",
  jpg: "IMAGEN",
  jpeg: "IMAGEN",
  png: "IMAGEN",
  gif: "IMAGEN",
  webp: "IMAGEN",
  svg: "IMAGEN",
  mp4: "VIDEO",
  mov: "VIDEO",
  avi: "VIDEO",
  webm: "VIDEO",
};

export function inferirTipo(nombreArchivo: string): TipoContenido {
  const ext = nombreArchivo.toLowerCase().split(".").pop() ?? "";
  const tipo = EXTENSIONES[ext];
  if (!tipo) {
    throw new AppError(400, `Formato de archivo no soportado (.${ext}). Permitidos: ${Object.keys(EXTENSIONES).join(", ")}`);
  }
  return tipo;
}

function toContenidoDto(contenido: {
  id: string;
  seccion_id: string;
  tipo: TipoContenido;
  titulo: string;
  texto_contenido: string | null;
  archivo_url: string | null;
  archivo_nombre: string | null;
  archivo_formato: string | null;
  archivo_tamano_kb: number | null;
  rag_indexado: boolean;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: contenido.id,
    seccion_id: contenido.seccion_id,
    tipo: contenido.tipo,
    titulo: contenido.titulo,
    texto_contenido: contenido.texto_contenido,
    archivo_url: contenido.archivo_url,
    archivo_nombre: contenido.archivo_nombre,
    archivo_formato: contenido.archivo_formato,
    archivo_tamano_kb: contenido.archivo_tamano_kb,
    rag_indexado: contenido.rag_indexado,
    created_at: contenido.created_at,
    updated_at: contenido.updated_at,
  };
}

async function obtenerSeccionYVerificarAccesoLectura(seccionId: string, usuarioId: string, rol: Rol) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seccionId)) {
    throw new AppError(404, "Seccion no encontrada");
  }

  const seccion = await prisma.seccion.findUnique({ where: { id: seccionId } });

  if (!seccion) {
    throw new AppError(404, "Seccion no encontrada");
  }

  if (rol === "PROFESOR" || rol === "ADMIN") {
    const perfil = await obtenerProfesorAsignado(seccion.materia_id, usuarioId);

    if (!perfil) {
      throw new AppError(403, "No tenes acceso a esta materia");
    }
  } else {
    const inscripcion = await obtenerInscripcion(seccion.materia_id, usuarioId);

    if (!inscripcion) {
      throw new AppError(403, "No tenes acceso a esta materia");
    }
  }

  return seccion;
}

async function obtenerSeccionYVerificarEscritura(seccionId: string, usuarioId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seccionId)) {
    throw new AppError(404, "Seccion no encontrada");
  }

  const seccion = await prisma.seccion.findUnique({ where: { id: seccionId } });

  if (!seccion) {
    throw new AppError(404, "Seccion no encontrada");
  }

  const perfil = await obtenerProfesorAsignado(seccion.materia_id, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  return seccion;
}

async function obtenerContenidoYVerificarEscritura(contenidoId: string, usuarioId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contenidoId)) {
    throw new AppError(404, "Contenido no encontrado");
  }

  const contenido = await prisma.contenido.findUnique({ where: { id: contenidoId } });

  if (!contenido) {
    throw new AppError(404, "Contenido no encontrado");
  }

  await obtenerSeccionYVerificarEscritura(contenido.seccion_id, usuarioId);

  return contenido;
}

export async function listarPorSeccion(
  seccionId: string,
  usuarioId: string,
  rol: Rol
) {
  await obtenerSeccionYVerificarAccesoLectura(seccionId, usuarioId, rol);

  const contenidos = await prisma.contenido.findMany({
    where: { seccion_id: seccionId },
    orderBy: { created_at: "asc" },
  });

  return contenidos.map(toContenidoDto);
}

export async function crear(
  seccionId: string,
  input: CrearContenidoInput,
  usuarioId: string
) {
  const seccion = await obtenerSeccionYVerificarEscritura(seccionId, usuarioId);

  const contenido = await prisma.contenido.create({
    data: {
      seccion_id: seccionId,
      tipo: input.tipo,
      titulo: input.titulo,
      texto_contenido: input.texto_contenido,
      archivo_url: input.archivo_url,
      archivo_nombre: input.archivo_nombre,
      archivo_formato: input.archivo_formato,
      archivo_tamano_kb: input.archivo_tamano_kb,
    },
  });

  if (input.tipo === "TEXTO" && input.texto_contenido) {
    indexarEnSegundoPlano(contenido.id, seccion.materia_id, {
      tipo: "texto",
      texto: input.texto_contenido,
    });
  }

  return toContenidoDto(contenido);
}

export async function crearArchivo(
  seccionId: string,
  usuarioId: string,
  archivo: { buffer: Buffer; nombreOriginal: string; titulo: string }
) {
  const seccion = await obtenerSeccionYVerificarEscritura(seccionId, usuarioId);
  const tipo = inferirTipo(archivo.nombreOriginal);
  const guardado = await guardarArchivo(archivo.buffer, archivo.nombreOriginal);

  const contenido = await prisma.contenido.create({
    data: {
      seccion_id: seccionId,
      tipo,
      titulo: archivo.titulo,
      archivo_url: guardado.url,
      archivo_nombre: guardado.nombre,
      archivo_formato: guardado.formato,
      archivo_tamano_kb: guardado.tamanoKb,
    },
  });

  // VIDEO sigue sin indexarse: el RAG trabaja con texto. IMAGEN si se indexa
  // desde CU-P02, porque el ai-service le pasa OCR antes de embeber.
  // El indexado corre en segundo plano: un PDF grande tarda minutos.
  if (tipo !== "VIDEO") {
    indexarEnSegundoPlano(contenido.id, seccion.materia_id, {
      tipo: "archivo",
      buffer: archivo.buffer,
      nombre: archivo.nombreOriginal,
    });
  }

  return toContenidoDto(contenido);
}

export async function actualizar(
  contenidoId: string,
  input: ActualizarContenidoInput,
  usuarioId: string
) {
  const contenido = await obtenerContenidoYVerificarEscritura(contenidoId, usuarioId);

  const seccion = await prisma.seccion.findUnique({ where: { id: contenido.seccion_id } });

  const tipoFinal = input.tipo ?? contenido.tipo;
  const textoFinal = input.texto_contenido !== undefined
    ? input.texto_contenido
    : contenido.texto_contenido;
  const reindexar = tipoFinal === "TEXTO" && Boolean(textoFinal) && Boolean(seccion);

  const actualizado = await prisma.contenido.update({
    where: { id: contenidoId },
    data: {
      tipo: input.tipo,
      titulo: input.titulo,
      texto_contenido: input.texto_contenido,
      archivo_url: input.archivo_url,
      archivo_nombre: input.archivo_nombre,
      archivo_formato: input.archivo_formato,
      archivo_tamano_kb: input.archivo_tamano_kb,
      rag_indexado: reindexar || input.tipo === "TEXTO" ? false : contenido.rag_indexado,
    },
  });

  if (reindexar && seccion && textoFinal) {
    indexarEnSegundoPlano(contenidoId, seccion.materia_id, { tipo: "texto", texto: textoFinal });
  }

  return toContenidoDto(actualizado);
}

export async function eliminar(contenidoId: string, usuarioId: string) {
  const contenido = await obtenerContenidoYVerificarEscritura(contenidoId, usuarioId);

  const seccion = await prisma.seccion.findUnique({ where: { id: contenido.seccion_id } });

  await prisma.contenido.delete({ where: { id: contenidoId } });

  await eliminarArchivo(contenido.archivo_url);

  // Sin esto el tutor seguia citando material que ya no existe.
  if (seccion) {
    await eliminarMaterialRag(seccion.materia_id, contenidoId);
  }

  return { ok: true };
}

// Si el alumno reabre el mismo material dentro de esta ventana no se vuelve a registrar:
// evita inflar las estadisticas con recargas de pagina.
const VENTANA_ACCESO_MS = 5 * 60 * 1000;

/** CU-A02: registra que un alumno abrio un material (alimenta las estadisticas del docente). */
export async function registrarAcceso(contenidoId: string, alumnoId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contenidoId)) {
    throw new AppError(404, "Contenido no encontrado");
  }

  const contenido = await prisma.contenido.findUnique({
    where: { id: contenidoId },
    include: { seccion: { select: { materia_id: true } } },
  });

  if (!contenido) {
    throw new AppError(404, "Contenido no encontrado");
  }

  const inscripcion = await obtenerInscripcion(contenido.seccion.materia_id, alumnoId);

  if (!inscripcion) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const reciente = await prisma.accesoContenido.findFirst({
    where: {
      contenido_id: contenidoId,
      alumno_id: alumnoId,
      accedido_en: { gt: new Date(Date.now() - VENTANA_ACCESO_MS) },
    },
    select: { id: true },
  });

  if (reciente) {
    return { registrado: false };
  }

  await prisma.accesoContenido.create({ data: { contenido_id: contenidoId, alumno_id: alumnoId } });

  return { registrado: true };
}

/** Cuantos alumnos abrieron cada material de la materia (vista del docente). */
export async function estadisticasDeAcceso(materiaId: string, usuarioId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(materiaId)) {
    throw new AppError(404, "Materia no encontrada");
  }

  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const [contenidos, accesos, inscriptos] = await Promise.all([
    prisma.contenido.findMany({
      where: { seccion: { materia_id: materiaId } },
      select: { id: true, titulo: true, tipo: true },
      orderBy: { created_at: "asc" },
    }),
    prisma.accesoContenido.findMany({
      where: { contenido: { seccion: { materia_id: materiaId } } },
      select: { contenido_id: true, alumno_id: true, accedido_en: true },
    }),
    prisma.inscripcion.count({ where: { materia_id: materiaId } }),
  ]);

  const porContenido = new Map<string, { alumnos: Set<string>; total: number; ultimo: Date | null }>();

  for (const a of accesos) {
    const fila = porContenido.get(a.contenido_id) ?? { alumnos: new Set<string>(), total: 0, ultimo: null };
    fila.alumnos.add(a.alumno_id);
    fila.total += 1;
    if (!fila.ultimo || a.accedido_en > fila.ultimo) fila.ultimo = a.accedido_en;
    porContenido.set(a.contenido_id, fila);
  }

  return {
    inscriptos,
    contenidos: contenidos.map((c) => {
      const fila = porContenido.get(c.id);
      return {
        contenido_id: c.id,
        titulo: c.titulo,
        tipo: c.tipo,
        alumnos_distintos: fila?.alumnos.size ?? 0,
        accesos: fila?.total ?? 0,
        ultimo_acceso: fila?.ultimo ?? null,
      };
    }),
  };
}
