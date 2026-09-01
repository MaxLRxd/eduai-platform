import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import { obtenerInscripcion, obtenerProfesorAsignado } from "../materias/materias.service";
import type { UpsertPlanningInput } from "./planning.schemas";

function validarFecha(fecha: string): Date {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, "Fecha invalida (formato ISO YYYY-MM-DD)");
  }
  return date;
}

function assertUuid(id: string, mensaje: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new AppError(404, mensaje);
  }
}

export async function listarPlanning(materiaId: string, usuarioId: string) {
  assertUuid(materiaId, "Materia no encontrada");

  const materia = await prisma.materia.findUnique({ where: { id: materiaId } });

  if (!materia) {
    throw new AppError(404, "Materia no encontrada");
  }

  const [profesor, alumno] = await Promise.all([
    obtenerProfesorAsignado(materiaId, usuarioId),
    obtenerInscripcion(materiaId, usuarioId),
  ]);

  if (!profesor && !alumno) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const planning = await prisma.planningClase.findMany({
    where: { materia_id: materiaId },
    orderBy: { fecha_clase: "asc" },
  });

  return planning.map((p) => ({
    id: p.id,
    fecha_clase: p.fecha_clase,
    titulo: p.titulo,
    contenido: p.contenido,
    estado: p.estado,
  }));
}

export async function upsertPlanning(
  materiaId: string,
  fecha: string,
  input: UpsertPlanningInput,
  usuarioId: string
) {
  assertUuid(materiaId, "Materia no encontrada");

  const materia = await prisma.materia.findUnique({ where: { id: materiaId } });

  if (!materia) {
    throw new AppError(404, "Materia no encontrada");
  }

  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

  if (!perfil) {
    throw new AppError(403, "Solo un profesor asignado puede planificar");
  }

  const fechaClase = validarFecha(fecha);

  const planning = await prisma.planningClase.upsert({
    where: {
      materia_id_fecha_clase: { materia_id: materiaId, fecha_clase: fechaClase },
    },
    update: {
      titulo: input.titulo,
      contenido: input.contenido,
      estado: input.estado,
    },
    create: {
      materia_id: materiaId,
      fecha_clase: fechaClase,
      titulo: input.titulo,
      contenido: input.contenido,
      estado: input.estado ?? "PLANIFICADO",
    },
  });

  return {
    id: planning.id,
    fecha_clase: planning.fecha_clase,
    titulo: planning.titulo,
    contenido: planning.contenido,
    estado: planning.estado,
  };
}
