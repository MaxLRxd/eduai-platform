import type { Rol } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import { eliminarMaterialRag } from "../../config/aiClient";
import { eliminarArchivo } from "../../config/storage";
import { guardarMaterialIndexable } from "../contenidos/contenidos.service";
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
  seccion_id: string | null;
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
    seccion_id: p.seccion_id,
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

export async function listarPlanning(materiaId: string, usuarioId: string, rol: Rol) {
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
    where: {
      materia_id: materiaId,
      ...(rol === "ALUMNO" ? { estado: "PUBLICADO" } : {}),
    },
    orderBy: { fecha_clase: "asc" },
  });

  return planning.map(toPlanningDto);
}

async function validarSeccionDeMateria(materiaId: string, seccionId: string) {
  assertUuid(seccionId, "Seccion no encontrada");
  const seccion = await prisma.seccion.findUnique({ where: { id: seccionId }, select: { materia_id: true } });
  if (!seccion || seccion.materia_id !== materiaId) {
    throw new AppError(400, "La unidad no pertenece a esta materia");
  }
  return seccion;
}

async function seccionParaMaterial(materiaId: string, claseId?: string) {
  if (claseId) {
    const seccionDeLaClase = await prisma.planningClase.findUnique({
      where: { id: claseId },
      select: { seccion_id: true },
    });
    if (seccionDeLaClase?.seccion_id) return seccionDeLaClase.seccion_id;
  }

  const primera = await prisma.seccion.findFirst({
    where: { materia_id: materiaId },
    orderBy: { orden: "asc" },
    select: { id: true },
  });
  const ultima = await prisma.seccion.findFirst({
    where: { materia_id: materiaId },
    orderBy: { orden: "desc" },
    select: { orden: true },
  });
  const seccionId = primera?.id ?? (
    await prisma.seccion.create({
      data: {
        materia_id: materiaId,
        nombre: "Materiales de clase",
        tipo: "TEORIA",
        orden: (ultima?.orden ?? 0) + 1,
      },
      select: { id: true },
    })
  ).id;

  if (claseId) {
    await prisma.planningClase.update({ where: { id: claseId }, data: { seccion_id: seccionId } });
  }

  return seccionId;
}

async function contenidoDelMaterial(claseId: string, url: string | null) {
  if (!url) return null;
  return prisma.contenido.findFirst({
    where: { clase_id: claseId, archivo_url: url },
    select: { id: true },
  });
}

async function retirarMaterialAnterior(materiaId: string, claseId: string, url: string | null) {
  const anterior = await contenidoDelMaterial(claseId, url);
  if (anterior) {
    await prisma.contenido.delete({ where: { id: anterior.id } });
    await eliminarMaterialRag(materiaId, anterior.id);
  }
  await eliminarArchivo(url);
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

  if (input.seccion_id) {
    await validarSeccionDeMateria(materiaId, input.seccion_id);
  }

  const seccionData = input.seccion_id !== undefined ? { seccion_id: input.seccion_id } : {};

  const planning = await prisma.planningClase.upsert({
    where: {
      materia_id_fecha_clase: { materia_id: materiaId, fecha_clase: fechaClase },
    },
    update: {
      titulo: input.titulo,
      contenido: input.contenido,
      estado: input.estado,
      ...seccionData,
    },
    create: {
      materia_id: materiaId,
      fecha_clase: fechaClase,
      titulo: input.titulo,
      contenido: input.contenido,
      estado: input.estado ?? "PLANIFICADO",
      ...seccionData,
    },
  });

  return toPlanningDto(planning);
}

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
  const existente = await prisma.planningClase.findUnique({
    where: { materia_id_fecha_clase: { materia_id: materiaId, fecha_clase: fechaClase } },
  });
  const seccionId = await seccionParaMaterial(materiaId, existente?.id);
  const { guardado } = await guardarMaterialIndexable({
    materiaId,
    seccionId,
    claseId: existente?.id ?? null,
    titulo: archivo.nombreOriginal.replace(/\.[^.]+$/, ""),
    buffer: archivo.buffer,
    nombreOriginal: archivo.nombreOriginal,
  });

  const planning = await prisma.planningClase.upsert({
    where: { materia_id_fecha_clase: { materia_id: materiaId, fecha_clase: fechaClase } },
    update: {
      seccion_id: seccionId,
      material_url: guardado.url,
      material_nombre: guardado.nombre,
      material_formato: guardado.formato,
      material_tamano_kb: guardado.tamanoKb,
    },
    create: {
      materia_id: materiaId,
      seccion_id: seccionId,
      fecha_clase: fechaClase,
      titulo: `Clase ${fechaClase.toISOString().slice(0, 10)}`,
      estado: "PLANIFICADO",
      material_url: guardado.url,
      material_nombre: guardado.nombre,
      material_formato: guardado.formato,
      material_tamano_kb: guardado.tamanoKb,
    },
  });

  await retirarMaterialAnterior(materiaId, planning.id, existente?.material_url ?? null);

  return toPlanningDto(planning);
}

export async function asignarMaterialDesdeContenido(
  materiaId: string,
  fecha: string,
  contenidoId: string,
  usuarioId: string
) {
  assertUuid(materiaId, "Materia no encontrada");
  assertUuid(contenidoId, "Material no encontrado");

  const materia = await prisma.materia.findUnique({ where: { id: materiaId } });
  if (!materia) {
    throw new AppError(404, "Materia no encontrada");
  }

  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);
  if (!perfil) {
    throw new AppError(403, "Solo un profesor asignado puede planificar");
  }

  const contenido = await prisma.contenido.findUnique({
    where: { id: contenidoId },
    include: { seccion: { select: { materia_id: true } } },
  });
  if (!contenido || contenido.seccion.materia_id !== materiaId) {
    throw new AppError(404, "Material no encontrado en esta materia");
  }
  if (!contenido.archivo_url) {
    throw new AppError(400, "El contenido seleccionado no tiene un archivo descargable");
  }

  const fechaClase = validarFecha(fecha);
  const existente = await prisma.planningClase.findUnique({
    where: { materia_id_fecha_clase: { materia_id: materiaId, fecha_clase: fechaClase } },
  });

  const planning = await prisma.planningClase.upsert({
    where: { materia_id_fecha_clase: { materia_id: materiaId, fecha_clase: fechaClase } },
    update: {
      seccion_id: contenido.seccion_id,
      material_url: contenido.archivo_url,
      material_nombre: contenido.archivo_nombre ?? contenido.titulo,
      material_formato: contenido.archivo_formato,
      material_tamano_kb: contenido.archivo_tamano_kb,
    },
    create: {
      materia_id: materiaId,
      seccion_id: contenido.seccion_id,
      fecha_clase: fechaClase,
      titulo: `Clase ${fechaClase.toISOString().slice(0, 10)}`,
      estado: "PLANIFICADO",
      material_url: contenido.archivo_url,
      material_nombre: contenido.archivo_nombre ?? contenido.titulo,
      material_formato: contenido.archivo_formato,
      material_tamano_kb: contenido.archivo_tamano_kb,
    },
  });

  await prisma.contenido.update({ where: { id: contenido.id }, data: { clase_id: planning.id } });

  if (existente?.material_url && existente.material_url !== contenido.archivo_url) {
    await retirarMaterialAnterior(materiaId, planning.id, existente.material_url);
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

  await retirarMaterialAnterior(materiaId, planning.id, planning.material_url);

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
