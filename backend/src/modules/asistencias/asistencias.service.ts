import type { EstadoAsistencia, Rol } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import {
  assertUuid,
  obtenerInscripcion,
  obtenerProfesorAsignado,
} from "../materias/materias.service";
import type {
  ActualizarAsistenciaInput,
  RegistraAsistenciaInput,
} from "./asistencias.schemas";

function normalizarFecha(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

function toAsistenciaDto(registro: {
  id: string;
  alumno_id: string;
  materia_id: string;
  fecha_clase: Date;
  estado: EstadoAsistencia;
  registrado_en: Date;
  editado_en: Date | null;
  alumno?: { id: string; nombre: string; email: string };
  materia?: { id: string; nombre: string };
}) {
  return {
    id: registro.id,
    alumno_id: registro.alumno_id,
    materia_id: registro.materia_id,
    fecha_clase: registro.fecha_clase.toISOString().slice(0, 10),
    estado: registro.estado,
    registrado_en: registro.registrado_en,
    editado_en: registro.editado_en,
    alumno: registro.alumno,
    materia: registro.materia,
  };
}

export async function listarPorMateria(
  materiaId: string,
  fecha: string | undefined,
  usuarioId: string,
  rol: Rol
) {
  if (rol === "PROFESOR" || rol === "ADMIN") {
    const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

    if (!perfil) {
      throw new AppError(403, "No tenes acceso a esta materia");
    }

    const where = fecha
      ? { materia_id: materiaId, fecha_clase: normalizarFecha(new Date(`${fecha}T00:00:00.000Z`)) }
      : { materia_id: materiaId };

    const registros = await prisma.asistencia.findMany({
      where,
      include: { alumno: { select: { id: true, nombre: true, email: true } } },
      orderBy: [{ fecha_clase: "desc" }, { alumno: { nombre: "asc" } }],
    });

    return registros.map(toAsistenciaDto);
  }

  const inscripcion = await obtenerInscripcion(materiaId, usuarioId);

  if (!inscripcion) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const registros = await prisma.asistencia.findMany({
    where: { materia_id: materiaId, alumno_id: usuarioId },
    orderBy: { fecha_clase: "desc" },
  });

  return registros.map(toAsistenciaDto);
}

export async function registrarDia(
  materiaId: string,
  input: RegistraAsistenciaInput,
  usuarioId: string
) {
  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const alumnoIds = [...new Set(input.registros.map((r) => r.alumno_id))];

  const inscripciones = await prisma.inscripcion.findMany({
    where: { materia_id: materiaId, alumno_id: { in: alumnoIds } },
    select: { alumno_id: true },
  });

  const inscriptos = new Set(inscripciones.map((i) => i.alumno_id));

  for (const alumnoId of alumnoIds) {
    if (!inscriptos.has(alumnoId)) {
      throw new AppError(400, `El alumno ${alumnoId} no esta inscripto a esta materia`);
    }
  }

  const fechaNormalizada = normalizarFecha(input.fecha_clase);

  await prisma.$transaction(
    input.registros.map((r) =>
      prisma.asistencia.upsert({
        where: {
          alumno_id_materia_id_fecha_clase: {
            alumno_id: r.alumno_id,
            materia_id: materiaId,
            fecha_clase: fechaNormalizada,
          },
        },
        update: {
          estado: r.estado,
          editado_en: new Date(),
        },
        create: {
          alumno_id: r.alumno_id,
          materia_id: materiaId,
          profesor_id: perfil.id,
          fecha_clase: fechaNormalizada,
          estado: r.estado,
        },
      })
    )
  );

  return {
    materia_id: materiaId,
    fecha_clase: fechaNormalizada.toISOString().slice(0, 10),
    registrados: alumnoIds.length,
  };
}

export async function actualizar(
  asistenciaId: string,
  input: ActualizarAsistenciaInput,
  usuarioId: string
) {
  await assertUuid(asistenciaId);
  const existente = await prisma.asistencia.findUnique({ where: { id: asistenciaId } });

  if (!existente) {
    throw new AppError(404, "Registro de asistencia no encontrado");
  }

  const perfil = await obtenerProfesorAsignado(existente.materia_id, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const registro = await prisma.asistencia.update({
    where: { id: asistenciaId },
    data: { estado: input.estado, editado_en: new Date() },
  });

  return toAsistenciaDto(registro);
}

export async function listarMias(usuarioId: string, rol: Rol) {
  if (rol !== "ALUMNO") {
    throw new AppError(403, "Solo los alumnos tienen asistencias propias");
  }

  const registros = await prisma.asistencia.findMany({
    where: { alumno_id: usuarioId },
    include: { materia: { select: { id: true, nombre: true } } },
    orderBy: [{ materia: { nombre: "asc" } }, { fecha_clase: "desc" }],
  });

  return registros.map(toAsistenciaDto);
}