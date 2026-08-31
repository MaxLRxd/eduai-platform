import type { Rol } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import {
  assertUuid,
  obtenerInscripcion,
  obtenerProfesorAsignado,
} from "../materias/materias.service";
import type { ActualizarNotaInput, CrearNotaInput } from "./notas.schemas";

interface NotaConAlumno {
  id: string;
  alumno_id: string;
  materia_id: string;
  periodo: string;
  calificacion: number;
  observaciones: string | null;
  registrado_en: Date;
  editado_en: Date | null;
  alumno?: { id: string; nombre: string; email: string };
  materia?: { id: string; nombre: string; nivel_educativo: string };
}

function toNotaDto(nota: {
  id: string;
  alumno_id: string;
  materia_id: string;
  periodo: string;
  calificacion: { toNumber(): number };
  observaciones: string | null;
  registrado_en: Date;
  editado_en: Date | null;
  alumno?: { id: string; nombre: string; email: string };
  materia?: { id: string; nombre: string; nivel_educativo: string };
}): NotaConAlumno {
  return {
    id: nota.id,
    alumno_id: nota.alumno_id,
    materia_id: nota.materia_id,
    periodo: nota.periodo,
    calificacion: nota.calificacion.toNumber(),
    observaciones: nota.observaciones,
    registrado_en: nota.registrado_en,
    editado_en: nota.editado_en,
    alumno: nota.alumno,
    materia: nota.materia,
  };
}

export async function listarPorMateria(materiaId: string, usuarioId: string, rol: Rol) {
  if (rol === "PROFESOR" || rol === "ADMIN") {
    const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

    if (!perfil) {
      throw new AppError(403, "No tenes acceso a esta materia");
    }

    const notas = await prisma.nota.findMany({
      where: { materia_id: materiaId },
      include: { alumno: { select: { id: true, nombre: true, email: true } } },
      orderBy: [{ alumno: { nombre: "asc" } }, { periodo: "asc" }],
    });

    return notas.map(toNotaDto);
  }

  const inscripcion = await obtenerInscripcion(materiaId, usuarioId);

  if (!inscripcion) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const notas = await prisma.nota.findMany({
    where: { materia_id: materiaId, alumno_id: usuarioId },
    orderBy: { periodo: "asc" },
  });

  return notas.map(toNotaDto);
}

export async function crear(materiaId: string, input: CrearNotaInput, usuarioId: string) {
  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const inscripcion = await obtenerInscripcion(materiaId, input.alumno_id);

  if (!inscripcion) {
    throw new AppError(400, "El alumno no esta inscripto a esta materia");
  }

  const nota = await prisma.nota.upsert({
    where: {
      alumno_id_materia_id_periodo: {
        alumno_id: input.alumno_id,
        materia_id: materiaId,
        periodo: input.periodo,
      },
    },
    update: {
      calificacion: input.calificacion,
      observaciones: input.observaciones,
      editado_en: new Date(),
    },
    create: {
      alumno_id: input.alumno_id,
      materia_id: materiaId,
      profesor_id: perfil.id,
      periodo: input.periodo,
      calificacion: input.calificacion,
      observaciones: input.observaciones,
    },
  });

  return toNotaDto(nota);
}

export async function actualizar(
  notaId: string,
  input: ActualizarNotaInput,
  usuarioId: string
) {
  await assertUuid(notaId);
  const notaExistente = await prisma.nota.findUnique({ where: { id: notaId } });

  if (!notaExistente) {
    throw new AppError(404, "Nota no encontrada");
  }

  const perfil = await obtenerProfesorAsignado(notaExistente.materia_id, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const nota = await prisma.nota.update({
    where: { id: notaId },
    data: {
      calificacion: input.calificacion,
      observaciones: input.observaciones,
      editado_en: new Date(),
    },
  });

  return toNotaDto(nota);
}

export async function listarMias(usuarioId: string, rol: Rol) {
  if (rol !== "ALUMNO") {
    throw new AppError(403, "Solo los alumnos tienen notas propias");
  }

  const notas = await prisma.nota.findMany({
    where: { alumno_id: usuarioId },
    include: { materia: { select: { id: true, nombre: true, nivel_educativo: true } } },
    orderBy: [{ materia: { nombre: "asc" } }, { periodo: "asc" }],
  });

  return notas.map(toNotaDto);
}