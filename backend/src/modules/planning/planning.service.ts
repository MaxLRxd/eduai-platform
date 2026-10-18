import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import { eliminarArchivo, guardarArchivo } from "../../config/storage";
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

type PlanningRow = {
  id: string;
  fecha_clase: Date;
  titulo: string;
  contenido: string | null;
  estado: string;
  material_url: string | null;
  material_nombre: string | null;
  material_formato: string | null;
  material_tamano_kb: number | null;
};

function toPlanningDto(p: PlanningRow) {
  return {
    id: p.id,
    fecha_clase: p.fecha_clase,
    titulo: p.titulo,
    contenido: p.contenido,
    estado: p.estado,
    material_url: p.material_url,
    material_nombre: p.material_nombre,
    material_formato: p.material_formato,
    material_tamano_kb: p.material_tamano_kb,
  };
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

  return planning.map(toPlanningDto);
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

  return toPlanningDto(planning);
}

// Sube (o reemplaza) el material de una clase. Crea la clase si no existe.
export async function subirMaterial(
  materiaId: string,
  fecha: string,
  usuarioId: string,
  archivo: { buffer: Buffer; nombreOriginal: string }
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
  const guardado = await guardarArchivo(archivo.buffer, archivo.nombreOriginal);

  const existente = await prisma.planningClase.findUnique({
    where: { materia_id_fecha_clase: { materia_id: materiaId, fecha_clase: fechaClase } },
  });

  const planning = await prisma.planningClase.upsert({
    where: { materia_id_fecha_clase: { materia_id: materiaId, fecha_clase: fechaClase } },
    update: {
      material_url: guardado.url,
      material_nombre: guardado.nombre,
      material_formato: guardado.formato,
      material_tamano_kb: guardado.tamanoKb,
    },
    create: {
      materia_id: materiaId,
      fecha_clase: fechaClase,
      titulo: `Clase ${fechaClase.toISOString().slice(0, 10)}`,
      estado: "PLANIFICADO",
      material_url: guardado.url,
      material_nombre: guardado.nombre,
      material_formato: guardado.formato,
      material_tamano_kb: guardado.tamanoKb,
    },
  });

  if (existente?.material_url && existente.material_url !== guardado.url) {
    await eliminarArchivo(existente.material_url);
  }

  return toPlanningDto(planning);
}

export async function eliminarMaterial(materiaId: string, fecha: string, usuarioId: string) {
  assertUuid(materiaId, "Materia no encontrada");

  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);
  if (!perfil) {
    throw new AppError(403, "Solo un profesor asignado puede planificar");
  }

  const fechaClase = validarFecha(fecha);
  const planning = await prisma.planningClase.findUnique({
    where: { materia_id_fecha_clase: { materia_id: materiaId, fecha_clase: fechaClase } },
  });

  if (!planning) {
    throw new AppError(404, "Clase no encontrada");
  }

  if (planning.material_url) {
    await eliminarArchivo(planning.material_url);
  }

  const actualizado = await prisma.planningClase.update({
    where: { id: planning.id },
    data: {
      material_url: null,
      material_nombre: null,
      material_formato: null,
      material_tamano_kb: null,
    },
  });

  return toPlanningDto(actualizado);
}
