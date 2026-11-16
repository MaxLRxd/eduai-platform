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

type FuenteAlumno = {
  alumno_id: string;
  nombre: string;
  tps: { nombre: string; tipo: string; nota: number; publicado: boolean }[];
  simulacros: { titulo: string; dificultad: string; puntaje: number; creado_en: Date }[];
};

function promedio(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return Math.round((valores.reduce((s, v) => s + v, 0) / valores.length) * 100) / 100;
}

/**
 * Fuentes de calificación del docente: TPs/actividades corregidas y simulacros
 * de examen rendidos por los alumnos. Calificaciones las muestra como insumo
 * antes de registrar la nota definitiva del período.
 */
export async function listarFuentesCalificacion(materiaId: string, usuarioId: string) {
  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);
  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const [entregas, simulacros] = await Promise.all([
    prisma.entrega.findMany({
      where: {
        actividad: { seccion: { materia_id: materiaId } },
        OR: [{ calificacion_final: { not: null } }, { calificacion_ia: { not: null } }],
      },
      select: {
        alumno_id: true,
        calificacion_final: true,
        calificacion_ia: true,
        publicado: true,
        alumno: { select: { nombre: true } },
        actividad: { select: { nombre: true, tipo: true } },
      },
      orderBy: { entregado_en: "desc" },
    }),
    prisma.intentoSimulacro.findMany({
      where: { materia_id: materiaId },
      select: {
        alumno_id: true,
        titulo: true,
        dificultad: true,
        puntaje: true,
        creado_en: true,
        alumno: { select: { nombre: true } },
      },
      orderBy: { creado_en: "desc" },
    }),
  ]);

  const alumnos = new Map<string, FuenteAlumno>();
  const obtener = (alumnoId: string, nombre: string): FuenteAlumno => {
    const existente = alumnos.get(alumnoId);
    if (existente) return existente;
    const nuevo: FuenteAlumno = { alumno_id: alumnoId, nombre, tps: [], simulacros: [] };
    alumnos.set(alumnoId, nuevo);
    return nuevo;
  };

  for (const e of entregas) {
    const nota = e.calificacion_final ?? e.calificacion_ia;
    if (nota == null) continue;
    obtener(e.alumno_id, e.alumno.nombre).tps.push({
      nombre: e.actividad.nombre,
      tipo: e.actividad.tipo,
      nota: nota.toNumber(),
      publicado: e.publicado,
    });
  }

  for (const s of simulacros) {
    obtener(s.alumno_id, s.alumno.nombre).simulacros.push({
      titulo: s.titulo,
      dificultad: s.dificultad,
      puntaje: s.puntaje.toNumber(),
      creado_en: s.creado_en,
    });
  }

  return [...alumnos.values()]
    .map((a) => ({
      alumno_id: a.alumno_id,
      nombre: a.nombre,
      tps: {
        cantidad: a.tps.length,
        promedio: promedio(a.tps.map((t) => t.nota)),
        detalle: a.tps,
      },
      simulacros: {
        cantidad: a.simulacros.length,
        promedio: promedio(a.simulacros.map((s) => s.puntaje)),
        detalle: a.simulacros,
      },
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}