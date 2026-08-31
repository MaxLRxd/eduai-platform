import type { Rol, TipoErrorDuda, TipoAlerta, NivelSeveridad } from "@prisma/client";
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
  nivel_comprension: { toNumber(): number };
  periodo: string;
  actualizado_en: Date;
}) {
  return {
    id: c.id,
    seccion_id: c.seccion_id,
    total_consultas: c.total_consultas,
    total_errores: c.total_errores,
    nivel_comprension: c.nivel_comprension.toNumber(),
    periodo: c.periodo,
    actualizado_en: c.actualizado_en,
  };
}

export async function listarComprension(materiaId: string, usuarioId: string, rol: Rol) {
  await verificarLecturaMateria(materiaId, usuarioId, rol);

  const registros = await prisma.analyticsComprensionTema.findMany({
    where: { materia_id: materiaId },
    orderBy: { actualizado_en: "desc" },
  });

  return registros.map(toComprensionDto);
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

export async function listarDudas(materiaId: string, usuarioId: string, rol: Rol) {
  await verificarLecturaMateria(materiaId, usuarioId, rol);

  const registros = await prisma.errorDudaFrecuente.findMany({
    where: { materia_id: materiaId },
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

const PERIODO_ACTUAL = "2026-1";

export async function registrarConsultaTutor(
  materiaId: string,
  descripcion: string,
  esError: boolean
) {
  const existente = await prisma.analyticsComprensionTema.findFirst({
    where: { materia_id: materiaId, periodo: PERIODO_ACTUAL },
  });

  if (existente) {
    await prisma.analyticsComprensionTema.update({
      where: { id: existente.id },
      data: {
        total_consultas: { increment: 1 },
        total_errores: { increment: esError ? 1 : 0 },
        nivel_comprension: 0.0,
        actualizado_en: new Date(),
      },
    });
  } else {
    await prisma.analyticsComprensionTema.create({
      data: {
        materia_id: materiaId,
        total_consultas: 1,
        total_errores: esError ? 1 : 0,
        nivel_comprension: 0.0,
        periodo: PERIODO_ACTUAL,
      },
    });
  }

  const duda = await prisma.errorDudaFrecuente.findFirst({
    where: { materia_id: materiaId, descripcion, periodo: PERIODO_ACTUAL },
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
        tipo: esError ? ("ERROR" as TipoErrorDuda) : ("DUDA" as TipoErrorDuda),
        descripcion,
        frecuencia: 1,
        periodo: PERIODO_ACTUAL,
      },
    });
  }
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
