import type { Rol } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import {
  assertUuid,
  obtenerInscripcion,
  obtenerProfesorAsignado,
} from "../materias/materias.service";
import type {
  ActualizarNotaInput,
  CategoriasNotaInput,
  CrearNotaInput,
  SincronizarActividadInput,
} from "./notas.schemas";
import { promedioPonderado, promedioPorCategoria, type ResultadoPromedio } from "./notas.promedio";

interface NotaConAlumno {
  id: string;
  alumno_id: string;
  materia_id: string;
  periodo: string;
  evaluacion: string;
  categoria_id: string | null;
  actividad_id: string | null;
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
  evaluacion: string;
  categoria_id: string | null;
  actividad_id: string | null;
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
    evaluacion: nota.evaluacion,
    categoria_id: nota.categoria_id,
    actividad_id: nota.actividad_id,
    calificacion: nota.calificacion.toNumber(),
    observaciones: nota.observaciones,
    registrado_en: nota.registrado_en,
    editado_en: nota.editado_en,
    alumno: nota.alumno,
    materia: nota.materia,
  };
}

function dtoCategoria(c: { id: string; nombre: string; peso: { toNumber(): number }; orden: number }) {
  return { id: c.id, nombre: c.nombre, peso: c.peso.toNumber(), orden: c.orden };
}

async function exigirDocente(materiaId: string, usuarioId: string) {
  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);
  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }
  return perfil;
}

/** La categoria tiene que ser de la misma materia: si no, un docente podria usar la de otra. */
async function validarCategoria(materiaId: string, categoriaId: string | null | undefined): Promise<void> {
  if (!categoriaId) return;
  const categoria = await prisma.categoriaNota.findUnique({ where: { id: categoriaId } });
  if (!categoria || categoria.materia_id !== materiaId) {
    throw new AppError(400, "La categoria no pertenece a esta materia");
  }
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
  const perfil = await exigirDocente(materiaId, usuarioId);

  const inscripcion = await obtenerInscripcion(materiaId, input.alumno_id);

  if (!inscripcion) {
    throw new AppError(400, "El alumno no esta inscripto a esta materia");
  }

  await validarCategoria(materiaId, input.categoria_id);

  const evaluacion = input.evaluacion ?? "";
  // Una nota manual se identifica por alumno + periodo + nombre de evaluacion: cargarla de nuevo la actualiza.
  const existente = await prisma.nota.findFirst({
    where: {
      alumno_id: input.alumno_id,
      materia_id: materiaId,
      periodo: input.periodo,
      evaluacion,
      actividad_id: null,
    },
  });

  const nota = existente
    ? await prisma.nota.update({
        where: { id: existente.id },
        data: {
          calificacion: input.calificacion,
          observaciones: input.observaciones,
          ...(input.categoria_id !== undefined ? { categoria_id: input.categoria_id } : {}),
          editado_en: new Date(),
        },
      })
    : await prisma.nota.create({
        data: {
          alumno_id: input.alumno_id,
          materia_id: materiaId,
          profesor_id: perfil.id,
          periodo: input.periodo,
          evaluacion,
          categoria_id: input.categoria_id ?? null,
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

  await validarCategoria(notaExistente.materia_id, input.categoria_id);

  const nota = await prisma.nota.update({
    where: { id: notaId },
    data: {
      calificacion: input.calificacion,
      observaciones: input.observaciones,
      // Una nota ligada a una actividad conserva el nombre de la actividad.
      ...(input.evaluacion !== undefined && !notaExistente.actividad_id ? { evaluacion: input.evaluacion } : {}),
      ...(input.categoria_id !== undefined ? { categoria_id: input.categoria_id } : {}),
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

// ───────────────────────── Categorias y promedio ponderado ─────────────────────────

export async function listarCategorias(materiaId: string, usuarioId: string, rol: Rol) {
  await assertUuid(materiaId);
  if (rol === "ALUMNO") {
    if (!(await obtenerInscripcion(materiaId, usuarioId))) {
      throw new AppError(403, "No tenes acceso a esta materia");
    }
  } else {
    await exigirDocente(materiaId, usuarioId);
  }

  const categorias = await prisma.categoriaNota.findMany({
    where: { materia_id: materiaId },
    orderBy: [{ orden: "asc" }, { created_at: "asc" }],
  });
  return categorias.map(dtoCategoria);
}

/**
 * Reemplaza la lista de categorias de la materia. Las que ya existian se identifican por `id`;
 * las que se quitan dejan sus notas sin categoria (no se borran). Lista vacia = promedio simple.
 */
export async function reemplazarCategorias(materiaId: string, input: CategoriasNotaInput, usuarioId: string) {
  await exigirDocente(materiaId, usuarioId);

  const existentes = await prisma.categoriaNota.findMany({ where: { materia_id: materiaId } });
  const idsExistentes = new Set(existentes.map((c) => c.id));
  const ajenas = input.categorias.filter((c) => c.id && !idsExistentes.has(c.id));
  if (ajenas.length > 0) {
    throw new AppError(400, "Hay categorias que no pertenecen a esta materia");
  }

  const idsConservados = new Set(input.categorias.map((c) => c.id).filter((id): id is string => Boolean(id)));
  const aBorrar = existentes.filter((c) => !idsConservados.has(c.id)).map((c) => c.id);

  await prisma.$transaction(async (tx) => {
    if (aBorrar.length > 0) {
      await tx.categoriaNota.deleteMany({ where: { id: { in: aBorrar } } });
    }
    // Primero se les pone un nombre provisorio a las que ya existen, para que dos categorias
    // puedan intercambiar nombres sin chocar con la restriccion de nombre unico.
    for (const c of input.categorias) {
      if (c.id) {
        await tx.categoriaNota.update({ where: { id: c.id }, data: { nombre: `__tmp_${c.id}` } });
      }
    }
    for (const [orden, c] of input.categorias.entries()) {
      if (c.id) {
        await tx.categoriaNota.update({ where: { id: c.id }, data: { nombre: c.nombre, peso: c.peso, orden } });
      } else {
        await tx.categoriaNota.create({ data: { materia_id: materiaId, nombre: c.nombre, peso: c.peso, orden } });
      }
    }
  });

  return listarCategorias(materiaId, usuarioId, "PROFESOR");
}

export interface DesgloseMateria extends ResultadoPromedio {
  /** Categorias de la materia con el promedio del alumno en cada una (null si aun no tiene notas ahi). */
  categorias: { id: string; nombre: string; peso: number; promedio: number | null }[];
}

/**
 * Promedio final por materia para un alumno, con el desglose por categoria que lo explica.
 * Lo usan el dashboard, el progreso y el perfil del alumno, para que todos muestren el mismo numero.
 */
export async function calcularDesglosePorMateria(
  notas: { materia_id: string; categoria_id: string | null; calificacion: number }[]
): Promise<Map<string, DesgloseMateria>> {
  const materiaIds = [...new Set(notas.map((n) => n.materia_id))];
  const categoriasDb =
    materiaIds.length > 0
      ? await prisma.categoriaNota.findMany({
          where: { materia_id: { in: materiaIds } },
          orderBy: [{ orden: "asc" }, { created_at: "asc" }],
        })
      : [];

  const resultado = new Map<string, DesgloseMateria>();
  for (const materiaId of materiaIds) {
    const suyas = notas.filter((n) => n.materia_id === materiaId);
    const categorias = categoriasDb
      .filter((c) => c.materia_id === materiaId)
      .map((c) => ({ id: c.id, nombre: c.nombre, peso: c.peso.toNumber() }));
    const porCategoria = promedioPorCategoria(suyas, categorias);
    resultado.set(materiaId, {
      ...promedioPonderado(suyas, categorias),
      categorias: categorias.map((c) => ({ ...c, promedio: porCategoria[c.id] })),
    });
  }
  return resultado;
}

/** Igual que `calcularDesglosePorMateria`, pero solo con el promedio final. */
export async function calcularPromediosPorMateria(
  notas: { materia_id: string; categoria_id: string | null; calificacion: number }[]
): Promise<Map<string, ResultadoPromedio>> {
  return calcularDesglosePorMateria(notas);
}

/** Tabla de calificaciones del docente: por alumno, promedio de cada categoria y nota final ponderada. */
export async function resumenCalificaciones(materiaId: string, usuarioId: string, periodo?: string) {
  await exigirDocente(materiaId, usuarioId);

  const [categoriasDb, inscripciones, todas] = await Promise.all([
    prisma.categoriaNota.findMany({ where: { materia_id: materiaId }, orderBy: [{ orden: "asc" }, { created_at: "asc" }] }),
    prisma.inscripcion.findMany({
      where: { materia_id: materiaId },
      include: { alumno: { select: { id: true, nombre: true, email: true } } },
    }),
    prisma.nota.findMany({ where: { materia_id: materiaId }, orderBy: { registrado_en: "asc" } }),
  ]);

  const categorias = categoriasDb.map(dtoCategoria);
  const pesos = categorias.map((c) => ({ id: c.id, peso: c.peso }));
  const periodos = [...new Set(todas.map((n) => n.periodo))].sort();
  const notas = (periodo ? todas.filter((n) => n.periodo === periodo) : todas).map(toNotaDto);

  const alumnos = inscripciones
    .map((i) => {
      const suyas = notas.filter((n) => n.alumno_id === i.alumno_id);
      const { promedio: final, sin_categoria } = promedioPonderado(suyas, pesos);
      return {
        alumno_id: i.alumno_id,
        nombre: i.alumno.nombre,
        email: i.alumno.email,
        promedio: final,
        sin_categoria,
        por_categoria: promedioPorCategoria(suyas, pesos),
        notas: suyas,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return { categorias, periodos, alumnos };
}

/**
 * Trae a las calificaciones las notas de una actividad: una nota por alumno, ligada a la actividad.
 * Solo toma correcciones ya PUBLICADAS (lo que el alumno ve), asi la IA nunca decide una nota sola.
 * Se puede repetir: actualiza las ya importadas en lugar de duplicarlas.
 */
export async function sincronizarDesdeActividad(
  actividadId: string,
  input: SincronizarActividadInput,
  usuarioId: string
) {
  await assertUuid(actividadId);
  const actividad = await prisma.actividad.findUnique({
    where: { id: actividadId },
    include: { seccion: { select: { materia_id: true } } },
  });
  if (!actividad) {
    throw new AppError(404, "Actividad no encontrada");
  }
  const materiaId = actividad.seccion.materia_id;
  const perfil = await exigirDocente(materiaId, usuarioId);
  await validarCategoria(materiaId, input.categoria_id);

  const entregas = await prisma.entrega.findMany({ where: { actividad_id: actividadId } });
  const publicadas = entregas.filter((e) => e.publicado && e.calificacion_final != null);

  let creadas = 0;
  let actualizadas = 0;
  for (const e of publicadas) {
    const calificacion = e.calificacion_final!;
    const clave = { alumno_id_actividad_id: { alumno_id: e.alumno_id, actividad_id: actividadId } };
    const previa = await prisma.nota.findUnique({ where: clave });
    if (previa) {
      await prisma.nota.update({
        where: clave,
        data: {
          calificacion,
          periodo: input.periodo,
          ...(input.categoria_id !== undefined ? { categoria_id: input.categoria_id } : {}),
          editado_en: new Date(),
        },
      });
      actualizadas += 1;
    } else {
      await prisma.nota.create({
        data: {
          alumno_id: e.alumno_id,
          materia_id: materiaId,
          profesor_id: perfil.id,
          periodo: input.periodo,
          evaluacion: actividad.nombre,
          categoria_id: input.categoria_id ?? null,
          actividad_id: actividadId,
          calificacion,
        },
      });
      creadas += 1;
    }
  }

  return {
    creadas,
    actualizadas,
    sin_publicar: entregas.length - publicadas.length,
  };
}
