import { calcularDesglosePorMateria } from "../notas/notas.service";
import { conteoDeEstados, porcentajeAsistencia } from "../asistencias/asistencia.calculo";
import type {
  EstadoAsistencia,
  NivelSeveridad,
  Rol,
  TipoAlerta,
  TipoErrorDuda,
} from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import { obtenerInscripcion, obtenerProfesorAsignado } from "../materias/materias.service";
import type {
  ActualizarPreguntaFrecuenteInput,
  CrearPreguntaFrecuenteInput,
} from "./analytics.schemas";

async function verificarLecturaMateria(materiaId: string, usuarioId: string, rol: Rol) {
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
}

async function verificarProfesorMateria(materiaId: string, usuarioId: string) {
  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  return perfil;
}

function toComprensionDto(c: {
  id: string;
  materia_id: string;
  seccion_id: string | null;
  total_consultas: number;
  total_errores: number;
  nivel_comprension: { toNumber(): number } | null;
  periodo: string;
  actualizado_en: Date;
}) {
  return {
    id: c.id,
    seccion_id: c.seccion_id,
    total_consultas: c.total_consultas,
    total_errores: c.total_errores,
    nivel_comprension: c.nivel_comprension?.toNumber() ?? null,
    periodo: c.periodo,
    actualizado_en: c.actualizado_en,
  };
}

/** Filtros del dashboard del docente: por periodo y/o por unidad ("general" = consultas sin unidad). */
export interface FiltrosAnalytics {
  periodo?: string;
  seccion_id?: string;
}

function whereDeFiltros(materiaId: string, filtros: FiltrosAnalytics) {
  return {
    materia_id: materiaId,
    ...(filtros.periodo ? { periodo: filtros.periodo } : {}),
    ...(filtros.seccion_id ? { seccion_id: filtros.seccion_id === "general" ? null : filtros.seccion_id } : {}),
  };
}

export async function listarComprension(
  materiaId: string,
  usuarioId: string,
  rol: Rol,
  filtros: FiltrosAnalytics = {}
) {
  await verificarLecturaMateria(materiaId, usuarioId, rol);

  const [registros, periodos] = await Promise.all([
    prisma.analyticsComprensionTema.findMany({
      where: whereDeFiltros(materiaId, filtros),
      orderBy: { actualizado_en: "desc" },
    }),
    // Los periodos disponibles no dependen del filtro: son los que alimentan el selector.
    prisma.analyticsComprensionTema.findMany({
      where: { materia_id: materiaId },
      distinct: ["periodo"],
      select: { periodo: true },
      orderBy: { periodo: "asc" },
    }),
  ]);

  return { comprension: registros.map(toComprensionDto), periodos: periodos.map((p) => p.periodo) };
}

export async function listarRiesgo(materiaId: string, usuarioId: string, rol: Rol) {
  await verificarLecturaMateria(materiaId, usuarioId, rol);

  const alertas = await prisma.alertaRiesgoAcademico.findMany({
    where: { materia_id: materiaId },
    include: { alumno: { select: { id: true, nombre: true, email: true } } },
    orderBy: [{ activa: "desc" }, { generada_en: "desc" }],
  });

  return alertas.map((a) => ({
    id: a.id,
    alumno_id: a.alumno_id,
    alumno: a.alumno,
    tipo_alerta: a.tipo_alerta,
    descripcion: a.descripcion,
    nivel_severidad: a.nivel_severidad,
    activa: a.activa,
    generada_en: a.generada_en,
    resuelta_en: a.resuelta_en,
  }));
}

export async function listarDudas(
  materiaId: string,
  usuarioId: string,
  rol: Rol,
  filtros: FiltrosAnalytics = {}
) {
  await verificarLecturaMateria(materiaId, usuarioId, rol);

  const registros = await prisma.errorDudaFrecuente.findMany({
    where: whereDeFiltros(materiaId, filtros),
    orderBy: { frecuencia: "desc" },
  });

  return registros.map((r) => ({
    id: r.id,
    seccion_id: r.seccion_id,
    tipo: r.tipo,
    descripcion: r.descripcion,
    frecuencia: r.frecuencia,
    periodo: r.periodo,
    actualizado_en: r.actualizado_en,
  }));
}

export async function listarPreguntasFrecuentes(materiaId: string, usuarioId: string, rol: Rol) {
  await verificarLecturaMateria(materiaId, usuarioId, rol);

  const preguntas = await prisma.preguntaFrecuente.findMany({
    where: { materia_id: materiaId, activa: true },
    orderBy: { created_at: "desc" },
  });

  return preguntas.map((p) => ({
    id: p.id,
    pregunta: p.pregunta,
    respuesta: p.respuesta,
    created_at: p.created_at,
  }));
}

export async function crearPreguntaFrecuente(
  materiaId: string,
  input: CrearPreguntaFrecuenteInput,
  usuarioId: string
) {
  await verificarProfesorMateria(materiaId, usuarioId);

  const pregunta = await prisma.preguntaFrecuente.create({
    data: {
      materia_id: materiaId,
      pregunta: input.pregunta,
      respuesta: input.respuesta,
    },
  });

  return { id: pregunta.id, pregunta: pregunta.pregunta, respuesta: pregunta.respuesta };
}

export async function actualizarPreguntaFrecuente(
  preguntaId: string,
  input: ActualizarPreguntaFrecuenteInput,
  usuarioId: string
) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(preguntaId)) {
    throw new AppError(404, "Pregunta frecuente no encontrada");
  }

  const existente = await prisma.preguntaFrecuente.findUnique({ where: { id: preguntaId } });

  if (!existente) {
    throw new AppError(404, "Pregunta frecuente no encontrada");
  }

  await verificarProfesorMateria(existente.materia_id, usuarioId);

  const pregunta = await prisma.preguntaFrecuente.update({
    where: { id: preguntaId },
    data: {
      pregunta: input.pregunta,
      respuesta: input.respuesta,
    },
  });

  return { id: pregunta.id, pregunta: pregunta.pregunta, respuesta: pregunta.respuesta };
}

export async function eliminarPreguntaFrecuente(preguntaId: string, usuarioId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(preguntaId)) {
    throw new AppError(404, "Pregunta frecuente no encontrada");
  }

  const existente = await prisma.preguntaFrecuente.findUnique({ where: { id: preguntaId } });

  if (!existente) {
    throw new AppError(404, "Pregunta frecuente no encontrada");
  }

  await verificarProfesorMateria(existente.materia_id, usuarioId);

  await prisma.preguntaFrecuente.delete({ where: { id: preguntaId } });

  return { ok: true };
}

/** Período académico (YYYY-1 / YYYY-2) al que pertenece una fecha de clase. */
export function periodoDeFecha(fecha: Date): string {
  const anio = fecha.getUTCFullYear();
  const mes = fecha.getUTCMonth() + 1;
  return `${anio}-${mes <= 6 ? 1 : 2}`;
}

/**
 * Unidad a la que pertenece una consulta del tutor: la unidad de los materiales que el tutor cito.
 * Si cito materiales de varias unidades gana la mas citada; sin fuentes (o de otra materia) es null.
 */
export async function seccionDeFuentes(
  materiaId: string,
  fuentes: { material_id: string }[]
): Promise<string | null> {
  const ids = [...new Set(fuentes.map((f) => f.material_id))];
  if (ids.length === 0) return null;

  const contenidos = await prisma.contenido.findMany({
    where: { id: { in: ids }, seccion: { materia_id: materiaId } },
    select: { id: true, seccion_id: true },
  });
  const seccionPorContenido = new Map(contenidos.map((c) => [c.id, c.seccion_id]));

  const votos = new Map<string, number>();
  for (const f of fuentes) {
    const seccion = seccionPorContenido.get(f.material_id);
    if (seccion) votos.set(seccion, (votos.get(seccion) ?? 0) + 1);
  }
  const ranking = [...votos.entries()].sort((a, b) => b[1] - a[1]);
  return ranking[0]?.[0] ?? null;
}

/**
 * Cuenta una consulta del tutor en el tema (unidad) y el periodo que corresponden. No inventa un nivel
 * de comprension: eso queda sin evaluar hasta que haya una medicion real.
 */
export async function registrarConsultaTutor(
  materiaId: string,
  descripcion: string,
  esError: boolean,
  seccionId: string | null = null
) {
  const periodo = periodoDeFecha(new Date());

  const existente = await prisma.analyticsComprensionTema.findFirst({
    where: { materia_id: materiaId, seccion_id: seccionId, periodo },
  });

  if (existente) {
    await prisma.analyticsComprensionTema.update({
      where: { id: existente.id },
      data: {
        total_consultas: { increment: 1 },
        total_errores: { increment: esError ? 1 : 0 },
        actualizado_en: new Date(),
      },
    });
  } else {
    await prisma.analyticsComprensionTema.create({
      data: {
        materia_id: materiaId,
        seccion_id: seccionId,
        total_consultas: 1,
        total_errores: esError ? 1 : 0,
        nivel_comprension: null,
        periodo,
      },
    });
  }

  const duda = await prisma.errorDudaFrecuente.findFirst({
    where: { materia_id: materiaId, seccion_id: seccionId, descripcion, periodo },
  });

  if (duda) {
    await prisma.errorDudaFrecuente.update({
      where: { id: duda.id },
      data: { frecuencia: { increment: 1 }, actualizado_en: new Date() },
    });
  } else {
    await prisma.errorDudaFrecuente.create({
      data: {
        materia_id: materiaId,
        seccion_id: seccionId,
        tipo: esError ? ("ERROR" as TipoErrorDuda) : ("DUDA" as TipoErrorDuda),
        descripcion,
        frecuencia: 1,
        periodo,
      },
    });
  }
}

export async function progresoAlumno(alumnoId: string, periodo?: string) {
  const [inscripciones, todasLasNotas, todasLasAsistencias, entregas, totalActividades] =
    await Promise.all([
      prisma.inscripcion.findMany({
        where: { alumno_id: alumnoId },
        include: { materia: { select: { id: true, nombre: true } } },
        orderBy: { inscripto_en: "desc" },
      }),
      prisma.nota.findMany({
        where: { alumno_id: alumnoId },
        include: { materia: { select: { id: true, nombre: true } } },
        orderBy: { registrado_en: "desc" },
      }),
      prisma.asistencia.findMany({
        where: { alumno_id: alumnoId },
        include: { materia: { select: { id: true, nombre: true } } },
        orderBy: { fecha_clase: "desc" },
      }),
      prisma.entrega.findMany({
        where: { alumno_id: alumnoId },
        select: { id: true },
      }),
      prisma.actividad.count({
        where: { seccion: { materia: { inscripciones: { some: { alumno_id: alumnoId } } } } },
      }),
    ]);

  const periodos = [...new Set(todasLasNotas.map((n) => n.periodo))].sort();
  const notas = periodo ? todasLasNotas.filter((n) => n.periodo === periodo) : todasLasNotas;
  const asistencias = periodo
    ? todasLasAsistencias.filter((a) => periodoDeFecha(a.fecha_clase) === periodo)
    : todasLasAsistencias;

  const desglosePorMateria = await calcularDesglosePorMateria(
    notas.map((n) => ({
      materia_id: n.materia_id,
      categoria_id: n.categoria_id,
      calificacion: n.calificacion.toNumber(),
    }))
  );

  const asistenciasPorMateria = new Map<string, EstadoAsistencia[]>();
  for (const a of asistencias) {
    const arr = asistenciasPorMateria.get(a.materia_id) ?? [];
    arr.push(a.estado);
    asistenciasPorMateria.set(a.materia_id, arr);
  }

  const nombreCategoria = new Map(
    [...desglosePorMateria.values()].flatMap((d) => d.categorias.map((c) => [c.id, c.nombre] as const))
  );

  const resumen = inscripciones.map((insc) => {
    const desglose = desglosePorMateria.get(insc.materia_id);
    const promedio = desglose?.promedio ?? null;

    const estados = asistenciasPorMateria.get(insc.materia_id) ?? [];
    // La tardanza cuenta como media falta y el justificado no resta.
    const porcentajeAsistenciaMateria = porcentajeAsistencia(conteoDeEstados(estados)) ?? 0;

    return {
      materia_id: insc.materia.id,
      materia: insc.materia.nombre,
      promedio: promedio !== null ? Math.round(promedio * 100) / 100 : null,
      // Como se compone la nota: categorias con su peso y el promedio del alumno en cada una.
      categorias: desglose?.categorias ?? [],
      sin_categoria: desglose?.sin_categoria ?? 0,
      asistencia: porcentajeAsistenciaMateria,
    };
  });

  const promedios = resumen
    .map((r) => r.promedio)
    .filter((p): p is number => p !== null);

  const promedioGeneral =
    promedios.length > 0
      ? Math.round((promedios.reduce((a, b) => a + b, 0) / promedios.length) * 100) / 100
      : 0;

  const notasTotales = notas.map((n) => n.calificacion.toNumber());
  const mejorNota = notasTotales.length > 0 ? Math.max(...notasTotales) : 0;

  const asistenciaGlobal = porcentajeAsistencia(conteoDeEstados(asistencias.map((a) => a.estado))) ?? 0;

  return {
    periodos,
    periodo: periodo ?? null,
    resumen,
    promedio_general: promedioGeneral,
    mejor_nota: mejorNota,
    actividades: {
      entregadas: entregas.length,
      total: totalActividades,
    },
    asistencia_global: asistenciaGlobal,
    detalle: notas.map((n) => ({
      evaluacion: n.evaluacion || n.observaciones || `Periodo ${n.periodo}`,
      categoria: n.categoria_id ? (nombreCategoria.get(n.categoria_id) ?? null) : null,
      materia: n.materia.nombre,
      periodo: n.periodo,
      fecha: n.registrado_en.toISOString().slice(0, 10),
      nota: n.calificacion.toNumber(),
    })),
    asistencia: asistencias.map((a) => ({
      fecha: a.fecha_clase.toISOString().slice(0, 10),
      materia: a.materia.nombre,
      estado: a.estado,
    })),
  };
}

export async function crearAlertaRiesgo(
  alumnoId: string,
  materiaId: string,
  tipoAlerta: TipoAlerta,
  descripcion: string,
  nivelSeveridad: NivelSeveridad
) {
  return prisma.alertaRiesgoAcademico.create({
    data: {
      alumno_id: alumnoId,
      materia_id: materiaId,
      tipo_alerta: tipoAlerta,
      descripcion,
      nivel_severidad: nivelSeveridad,
    },
  });
}
