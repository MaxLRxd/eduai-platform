import type { Prisma, Rol } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import { crearNoLeidas } from "../notificaciones/notificaciones.service";
import {
  obtenerInscripcion,
  obtenerProfesorAsignado,
} from "../materias/materias.service";
import type {
  ActualizarActividadInput,
  CorregirEntregaInput,
  CrearActividadInput,
  CrearRubricaInput,
  EnviarEntregaInput,
} from "./actividades.schemas";

interface EntregaBase {
  id: string;
  actividad_id: string;
  alumno_id: string;
  respuesta_texto: string | null;
  respuesta_codigo: string | null;
  archivo_url: string | null;
  archivo_nombre: string | null;
  entregado_en: Date;
  feedback_ia: string | null;
  calificacion_ia: number | null;
  feedback_final: string | null;
  calificacion_final: number | null;
  publicado: boolean;
  revision_tipo: string | null;
  publicado_en: Date | null;
}

function toEntregaDto(entrega: {
  id: string;
  actividad_id: string;
  alumno_id: string;
  respuesta_texto: string | null;
  respuesta_codigo: string | null;
  archivo_url: string | null;
  archivo_nombre: string | null;
  entregado_en: Date;
  feedback_ia: string | null;
  calificacion_ia: { toNumber(): number } | null;
  feedback_final: string | null;
  calificacion_final: { toNumber(): number } | null;
  publicado: boolean;
  revision_tipo: string | null;
  publicado_en: Date | null;
}): EntregaBase {
  return {
    ...entrega,
    calificacion_ia: entrega.calificacion_ia?.toNumber() ?? null,
    calificacion_final: entrega.calificacion_final?.toNumber() ?? null,
  };
}

async function obtenerActividadODefecto(actividadId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actividadId)) {
    throw new AppError(404, "Actividad no encontrada");
  }

  const actividad = await prisma.actividad.findUnique({ where: { id: actividadId } });

  if (!actividad) {
    throw new AppError(404, "Actividad no encontrada");
  }

  return actividad;
}

export async function listarPorMateria(materiaId: string, usuarioId: string, rol: Rol) {
  if (rol === "PROFESOR" || rol === "ADMIN") {
    const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

    if (!perfil) {
      throw new AppError(403, "No tenes acceso a esta materia");
    }

    const actividades = await prisma.actividad.findMany({
      where: { seccion: { materia_id: materiaId } },
      include: {
        seccion: { select: { id: true, nombre: true, tipo: true } },
        rubrica: { select: { id: true, nombre: true } },
        _count: { select: { entregas: true } },
      },
      orderBy: { created_at: "asc" },
    });

    return actividades;
  }

  const inscripcion = await obtenerInscripcion(materiaId, usuarioId);

  if (!inscripcion) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const actividades = await prisma.actividad.findMany({
    where: { seccion: { materia_id: materiaId } },
    include: {
      seccion: { select: { id: true, nombre: true, tipo: true } },
      rubrica: { select: { id: true, nombre: true } },
      entregas: {
        where: { alumno_id: usuarioId },
        take: 1,
      },
    },
    orderBy: { created_at: "asc" },
  });

  return actividades.map((actividad) => {
    const { entregas, ...resto } = actividad;
    const entrega = entregas[0];

    return {
      ...resto,
      mi_entrega: entrega
        ? {
            id: entrega.id,
            entregado_en: entrega.entregado_en,
            publicado: entrega.publicado,
            calificacion_final: entrega.calificacion_final?.toNumber() ?? null,
            feedback_final: entrega.feedback_final,
          }
        : null,
      estado_entrega: !entrega ? "PENDIENTE" : entrega.publicado ? "PUBLICADA" : "ENVIADA",
    };
  });
}

export async function crear(materiaId: string, input: CrearActividadInput, usuarioId: string) {
  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const seccion = await prisma.seccion.findUnique({ where: { id: input.seccion_id } });

  if (!seccion || seccion.materia_id !== materiaId) {
    throw new AppError(400, "La seccion no pertenece a esta materia");
  }

  if (input.rubrica_id) {
    const rubrica = await prisma.rubrica.findUnique({ where: { id: input.rubrica_id } });

    if (!rubrica || rubrica.materia_id !== materiaId) {
      throw new AppError(400, "La rubrica no pertenece a esta materia");
    }
  }

  const actividad = await prisma.actividad.create({
    data: {
      seccion_id: input.seccion_id,
      rubrica_id: input.rubrica_id ?? null,
      nombre: input.nombre,
      consigna: input.consigna,
      tipo: input.tipo,
      opciones_mc: (input.opciones_mc as Prisma.InputJsonValue) ?? undefined,
      formatos_permitidos: input.formatos_permitidos ?? null,
      fecha_limite: input.fecha_limite,
      correccion_manual: input.correccion_manual,
    },
    include: {
      seccion: { select: { id: true, nombre: true, tipo: true } },
      rubrica: { select: { id: true, nombre: true } },
    },
  });

  return actividad;
}

async function obtenerMateriaDeSeccion(seccionId: string): Promise<string> {
  const seccion = await prisma.seccion.findUnique({ where: { id: seccionId } });

  if (!seccion) {
    throw new AppError(404, "Seccion no encontrada");
  }

  return seccion.materia_id;
}

export async function actualizar(
  actividadId: string,
  input: ActualizarActividadInput,
  usuarioId: string
) {
  const actividad = await obtenerActividadODefecto(actividadId);

  const materiaId = await obtenerMateriaDeSeccion(actividad.seccion_id);

  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const actualizada = await prisma.actividad.update({
    where: { id: actividadId },
    data: {
      nombre: input.nombre,
      consigna: input.consigna,
      tipo: input.tipo,
      opciones_mc: (input.opciones_mc as Prisma.InputJsonValue) ?? undefined,
      formatos_permitidos: input.formatos_permitidos ?? undefined,
      fecha_limite: input.fecha_limite,
      correccion_manual: input.correccion_manual,
      rubrica_id: input.rubrica_id,
    },
    include: {
      seccion: { select: { id: true, nombre: true, tipo: true } },
      rubrica: { select: { id: true, nombre: true } },
    },
  });

  return actualizada;
}

export async function enviar(actividadId: string, alumnoId: string, input: EnviarEntregaInput) {
  const actividad = await obtenerActividadODefecto(actividadId);

  const materiaId = await obtenerMateriaDeSeccion(actividad.seccion_id);

  const inscripcion = await obtenerInscripcion(materiaId, alumnoId);

  if (!inscripcion) {
    throw new AppError(403, "No estas inscripto a esta materia");
  }

  const entrega = await prisma.entrega.upsert({
    where: {
      actividad_id_alumno_id: { actividad_id: actividadId, alumno_id: alumnoId },
    },
    update: {
      respuesta_texto: input.respuesta_texto ?? null,
      respuesta_codigo: input.respuesta_codigo ?? null,
      archivo_url: input.archivo_url ?? null,
      archivo_nombre: input.archivo_nombre ?? null,
      entregado_en: new Date(),
    },
    create: {
      actividad_id: actividadId,
      alumno_id: alumnoId,
      respuesta_texto: input.respuesta_texto ?? null,
      respuesta_codigo: input.respuesta_codigo ?? null,
      archivo_url: input.archivo_url ?? null,
      archivo_nombre: input.archivo_nombre ?? null,
    },
  });

  const [alumno, profesores] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: alumnoId }, select: { nombre: true } }),
    prisma.materiaProfesor.findMany({
      where: { materia_id: materiaId, activo: true },
      select: { profesor: { select: { usuario_id: true } } },
    }),
  ]);

  await Promise.all(
    profesores.map((mp) =>
      crearNoLeidas({
        usuario_id: mp.profesor.usuario_id,
        tipo: "ENTREGA",
        titulo: "Nueva entrega",
        mensaje: `${alumno?.nombre ?? "El alumno"} entrego la actividad "${actividad.nombre}"`,
        referencia_tipo: "entrega",
        referencia_id: entrega.id,
      })
    )
  );

  return toEntregaDto(entrega);
}

export async function listarEntregas(actividadId: string, usuarioId: string) {
  const actividad = await obtenerActividadODefecto(actividadId);

  const materiaId = await obtenerMateriaDeSeccion(actividad.seccion_id);

  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const entregas = await prisma.entrega.findMany({
    where: { actividad_id: actividadId },
    include: {
      alumno: { select: { id: true, nombre: true, email: true } },
    },
    orderBy: { entregado_en: "asc" },
  });

  return entregas.map((entrega) => toEntregaDto(entrega));
}

export async function corregir(
  entregaId: string,
  input: CorregirEntregaInput,
  usuarioId: string
) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entregaId)) {
    throw new AppError(404, "Entrega no encontrada");
  }

  const entrega = await prisma.entrega.findUnique({ where: { id: entregaId } });

  if (!entrega) {
    throw new AppError(404, "Entrega no encontrada");
  }

  const actividad = await obtenerActividadODefecto(entrega.actividad_id);

  const materiaId = await obtenerMateriaDeSeccion(actividad.seccion_id);

  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const corregida = await prisma.entrega.update({
    where: { id: entregaId },
    data: {
      feedback_final: input.feedback_final,
      calificacion_final: input.calificacion_final,
      revision_tipo: input.revision_tipo ?? "MANUAL",
      publicado: true,
      publicado_en: new Date(),
    },
    include: {
      alumno: { select: { id: true, nombre: true, email: true } },
    },
  });

  await crearNoLeidas({
    usuario_id: corregida.alumno_id,
    tipo: "FEEDBACK",
    titulo: "Entrega corregida",
    mensaje: `Tu actividad "${actividad.nombre}" fue corregida. Revisa el feedback.`,
    referencia_tipo: "entrega",
    referencia_id: corregida.id,
  });

  return toEntregaDto(corregida);
}

export async function listarPendientes(usuarioId: string) {
  const perfil = await prisma.profesor.findUnique({ where: { usuario_id: usuarioId } });

  if (!perfil) {
    throw new AppError(403, "Tenés que ser profesor para ver la cola de correcciones");
  }

  const materias = await prisma.materiaProfesor.findMany({
    where: { profesor_id: perfil.id, activo: true },
    select: { materia_id: true },
  });

  const materiaIds = materias.map((m) => m.materia_id);

  const entregas = await prisma.entrega.findMany({
    where: {
      publicado: false,
      actividad: { seccion: { materia_id: { in: materiaIds } } },
    },
    include: {
      alumno: { select: { id: true, nombre: true, email: true } },
      actividad: {
        select: {
          id: true,
          nombre: true,
          tipo: true,
          seccion: {
            select: {
              materia: { select: { id: true, nombre: true } },
            },
          },
        },
      },
    },
    orderBy: { entregado_en: "asc" },
  });

return entregas.map((entrega) => ({
    ...toEntregaDto(entrega),
    alumno: entrega.alumno,
    actividad: entrega.actividad,
    materia: entrega.actividad.seccion.materia,
  }));
}

export async function listarRubricas(materiaId: string, usuarioId: string) {
  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const rubricas = await prisma.rubrica.findMany({
    where: { materia_id: materiaId },
    include: { _count: { select: { actividades: true } } },
    orderBy: { created_at: "asc" },
  });

  return rubricas.map((rubrica) => ({
    id: rubrica.id,
    nombre: rubrica.nombre,
    descripcion: rubrica.descripcion,
    criterios: rubrica.criterios as object,
    actividades: rubrica._count.actividades,
  }));
}

export async function crearRubrica(
  materiaId: string,
  input: CrearRubricaInput,
  usuarioId: string
) {
  const perfil = await obtenerProfesorAsignado(materiaId, usuarioId);

  if (!perfil) {
    throw new AppError(403, "No tenes acceso a esta materia");
  }

  const rubrica = await prisma.rubrica.create({
    data: {
      profesor_id: perfil.id,
      materia_id: materiaId,
      nombre: input.nombre,
      descripcion: input.descripcion,
      criterios: input.criterios as Prisma.InputJsonValue,
    },
    include: { _count: { select: { actividades: true } } },
  });

  return {
    id: rubrica.id,
    nombre: rubrica.nombre,
    descripcion: rubrica.descripcion,
    criterios: rubrica.criterios as object,
    actividades: rubrica._count.actividades,
  };
}