import type { Rol, TipoSeccion } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import {
  assertUuid,
  obtenerInscripcion,
  obtenerProfesorAsignado,
} from "../materias/materias.service";
import type {
  ActualizarSeccionInput,
  CrearSeccionInput,
} from "./secciones.schemas";

function toSeccionDto(seccion: {
  id: string;
  materia_id: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoSeccion;
  orden: number;
  created_at: Date;
  updated_at: Date;
  _count?: { contenidos: number; actividades: number };
}) {
  return {
    id: seccion.id,
    materia_id: seccion.materia_id,
    nombre: seccion.nombre,
    descripcion: seccion.descripcion,
    tipo: seccion.tipo,
    orden: seccion.orden,
    contenidos: seccion._count?.contenidos ?? 0,
    actividades: seccion._count?.actividades ?? 0,
    created_at: seccion.created_at,
    updated_at: seccion.updated_at,
  };
}

const seccionInclude = {
  _count: { select: { contenidos: true, actividades: true } },
} as const;

export async function listarPorMateria(materiaId: string, usuarioId: string, rol: Rol) {
  await assertUuid(materiaId);

  if (rol === "PROFESOR" || rol === "ADMIN") {
    const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

    if (!perfil) {
      throw new AppError(403, "No tenes acceso a esta materia");
    }
  } else {
    const inscripcion = await obtenerInscripcion(materiaId, usuarioId);

    if (!inscripcion) {
      throw new AppError(403, "No tenes acceso a esta materia");
    }
  }

  const secciones = await prisma.seccion.findMany({
    where: { materia_id: materiaId },
    include: seccionInclude,
    orderBy: { orden: "asc" },
  });

  return secciones.map(toSeccionDto);
}

export async function crear(materiaId: string, input: CrearSeccionInput, usuarioId: string) {
  await assertUuid(materiaId);

  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const seccion = await prisma.seccion.create({
    data: {
      materia_id: materiaId,
      nombre: input.nombre,
      descripcion: input.descripcion,
      tipo: input.tipo,
      orden: input.orden,
    },
    include: seccionInclude,
  });

  return toSeccionDto(seccion);
}

async function obtenerSeccionYVerificar(seccionId: string, usuarioId: string) {
  await assertUuid(seccionId);

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

export async function actualizar(
  seccionId: string,
  input: ActualizarSeccionInput,
  usuarioId: string
) {
  await obtenerSeccionYVerificar(seccionId, usuarioId);

  const seccion = await prisma.seccion.update({
    where: { id: seccionId },
    data: {
      nombre: input.nombre,
      descripcion: input.descripcion,
      tipo: input.tipo,
      orden: input.orden,
    },
    include: seccionInclude,
  });

  return toSeccionDto(seccion);
}

export async function eliminar(seccionId: string, usuarioId: string) {
  await obtenerSeccionYVerificar(seccionId, usuarioId);

  await prisma.seccion.delete({ where: { id: seccionId } });

  return { ok: true };
}
