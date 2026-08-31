import type { Rol, TipoContenido } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import { indexMaterial } from "../../config/aiClient";
import {
  obtenerInscripcion,
  obtenerProfesorAsignado,
} from "../materias/materias.service";
import type {
  ActualizarContenidoInput,
  CrearContenidoInput,
} from "./contenidos.schemas";

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

  let ragIndexado = false;
  if (input.tipo === "TEXTO" && input.texto_contenido) {
    const resultado = await indexMaterial(seccion.materia_id, contenido.id, input.texto_contenido);
    ragIndexado = resultado?.indexed ?? false;
  }

  if (ragIndexado) {
    await prisma.contenido.update({
      where: { id: contenido.id },
      data: { rag_indexado: true },
    });
  }

  return toContenidoDto({ ...contenido, rag_indexado: contenido.rag_indexado || ragIndexado });
}

export async function actualizar(
  contenidoId: string,
  input: ActualizarContenidoInput,
  usuarioId: string
) {
  const contenido = await obtenerContenidoYVerificarEscritura(contenidoId, usuarioId);

  const seccion = await prisma.seccion.findUnique({ where: { id: contenido.seccion_id } });

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
      rag_indexado: input.tipo === "TEXTO" ? false : contenido.rag_indexado,
    },
  });

  const tipoFinal = input.tipo ?? contenido.tipo;
  const textoFinal = input.texto_contenido !== undefined
    ? input.texto_contenido
    : contenido.texto_contenido;

  let ragIndexado = actualizado.rag_indexado;
  if (tipoFinal === "TEXTO" && textoFinal && seccion) {
    const resultado = await indexMaterial(seccion.materia_id, contenidoId, textoFinal);
    ragIndexado = resultado?.indexed ?? false;

    if (ragIndexado) {
      await prisma.contenido.update({
        where: { id: contenidoId },
        data: { rag_indexado: true },
      });
    }
  }

  return toContenidoDto({ ...actualizado, rag_indexado: ragIndexado });
}

export async function eliminar(contenidoId: string, usuarioId: string) {
  await obtenerContenidoYVerificarEscritura(contenidoId, usuarioId);

  await prisma.contenido.delete({ where: { id: contenidoId } });

  return { ok: true };
}
