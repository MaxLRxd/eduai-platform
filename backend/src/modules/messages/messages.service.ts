import type { Rol } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import { crearNoLeidas } from "../notificaciones/notificaciones.service";
import type { BroadcastInput, EnviarMensajeInput } from "./messages.schemas";

function assertUuid(id: string, mensaje: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new AppError(404, mensaje);
  }
}

export async function listarConversaciones(usuarioId: string) {
  const membresias = await prisma.conversacionMiembro.findMany({
    where: { usuario_id: usuarioId },
    include: {
      conversacion: {
        include: {
          mensajes: {
            orderBy: { enviado_en: "desc" },
            take: 1,
          },
          miembros: {
            include: { usuario: { select: { id: true, nombre: true, email: true, rol: true } } },
          },
          _count: {
            select: {
              mensajes: { where: { leido: false, emisor_id: { not: usuarioId } } },
            },
          },
        },
      },
    },
    orderBy: { unido_en: "desc" },
  });

  return membresias.map((m) => {
    const otros = m.conversacion.miembros
      .filter((mi) => mi.usuario_id !== usuarioId)
      .map((mi) => mi.usuario);
    const ultimo = m.conversacion.mensajes[0] ?? null;
    return {
      id: m.conversacion_id,
      participante: otros[0] ?? null,
      participante_id: otros[0]?.id ?? null,
      no_leidos: m.conversacion._count.mensajes,
      ultimo_mensaje: ultimo
        ? {
            contenido: ultimo.contenido,
            emisor_id: ultimo.emisor_id,
            enviado_en: ultimo.enviado_en,
          }
        : null,
    };
  });
}

export async function obtenerMensajes(conversacionId: string, usuarioId: string) {
  assertUuid(conversacionId, "Conversacion no encontrada");

  const miembro = await prisma.conversacionMiembro.findUnique({
    where: {
      conversacion_id_usuario_id: { conversacion_id: conversacionId, usuario_id: usuarioId },
    },
  });

  if (!miembro) {
    throw new AppError(403, "No sos parte de esta conversacion");
  }

  const mensajes = await prisma.mensajeDirecto.findMany({
    where: { conversacion_id: conversacionId },
    orderBy: { enviado_en: "asc" },
  });

  // Abrir el hilo marca como leídos los mensajes recibidos.
  await prisma.mensajeDirecto.updateMany({
    where: { conversacion_id: conversacionId, emisor_id: { not: usuarioId }, leido: false },
    data: { leido: true },
  });

  return mensajes.map((msg) => ({
    id: msg.id,
    emisor_id: msg.emisor_id,
    contenido: msg.contenido,
    leido: msg.emisor_id === usuarioId ? msg.leido : true,
    enviado_en: msg.enviado_en,
  }));
}

/**
 * CU-A13: contactos habilitados según el rol. El alumno solo ve a los docentes de sus
 * materias; el docente solo a los alumnos inscriptos en las materias que dicta.
 */
export async function listarContactos(usuarioId: string, rol: Rol) {
  const mapa = new Map<
    string,
    { id: string; nombre: string; email: string; rol: Rol; materias: { id: string; nombre: string }[] }
  >();

  const agregar = (
    usuario: { id: string; nombre: string; email: string; rol: Rol },
    materia?: { id: string; nombre: string }
  ): void => {
    const actual = mapa.get(usuario.id) ?? { ...usuario, materias: [] };
    if (materia && !actual.materias.some((m) => m.id === materia.id)) {
      actual.materias.push(materia);
    }
    mapa.set(usuario.id, actual);
  };

  if (rol === "ALUMNO") {
    const inscripciones = await prisma.inscripcion.findMany({
      where: { alumno_id: usuarioId },
      select: {
        materia: {
          select: {
            id: true,
            nombre: true,
            profesores: {
              where: { activo: true },
              select: {
                profesor: {
                  select: {
                    usuario: { select: { id: true, nombre: true, email: true, rol: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    for (const insc of inscripciones) {
      for (const asignacion of insc.materia.profesores) {
        agregar(asignacion.profesor.usuario, { id: insc.materia.id, nombre: insc.materia.nombre });
      }
    }
  } else if (rol === "PROFESOR") {
    const perfil = await prisma.profesor.findUnique({ where: { usuario_id: usuarioId } });

    if (!perfil) {
      return [];
    }

    const asignaciones = await prisma.materiaProfesor.findMany({
      where: { profesor_id: perfil.id, activo: true },
      select: {
        materia: {
          select: {
            id: true,
            nombre: true,
            inscripciones: {
              select: { alumno: { select: { id: true, nombre: true, email: true, rol: true } } },
            },
          },
        },
      },
    });

    for (const asignacion of asignaciones) {
      for (const insc of asignacion.materia.inscripciones) {
        agregar(insc.alumno, { id: asignacion.materia.id, nombre: asignacion.materia.nombre });
      }
    }
  } else {
    const usuarios = await prisma.usuario.findMany({
      where: { activo: true, id: { not: usuarioId } },
      select: { id: true, nombre: true, email: true, rol: true },
    });

    for (const u of usuarios) {
      agregar(u);
    }
  }

  return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

async function exigirPuedeMensajear(
  emisorId: string,
  emisorRol: Rol,
  destinatario: { id: string; rol: Rol }
): Promise<void> {
  if (emisorRol === "ADMIN" || destinatario.rol === "ADMIN") {
    return;
  }

  if (emisorRol === "ALUMNO" && destinatario.rol === "PROFESOR") {
    const vinculo = await prisma.materiaProfesor.findFirst({
      where: {
        activo: true,
        profesor: { usuario_id: destinatario.id },
        materia: { inscripciones: { some: { alumno_id: emisorId } } },
      },
      select: { id: true },
    });

    if (vinculo) return;
    throw new AppError(403, "Solo podes escribirle a docentes de tus materias");
  }

  if (emisorRol === "PROFESOR" && destinatario.rol === "ALUMNO") {
    const perfil = await prisma.profesor.findUnique({ where: { usuario_id: emisorId } });

    if (perfil) {
      const vinculo = await prisma.materiaProfesor.findFirst({
        where: {
          activo: true,
          profesor_id: perfil.id,
          materia: { inscripciones: { some: { alumno_id: destinatario.id } } },
        },
        select: { id: true },
      });

      if (vinculo) return;
    }

    throw new AppError(403, "Solo podes escribirle a alumnos de tus materias");
  }

  throw new AppError(403, "No podes enviarle mensajes a ese usuario");
}

export async function enviarMensaje(usuarioId: string, rol: Rol, input: EnviarMensajeInput) {
  assertUuid(input.destinatario_id, "Destinatario no encontrado");

  const destinatario = await prisma.usuario.findUnique({ where: { id: input.destinatario_id } });

  if (!destinatario) {
    throw new AppError(404, "Destinatario no encontrado");
  }

  if (destinatario.id === usuarioId) {
    throw new AppError(400, "No podes enviarte un mensaje a vos mismo");
  }

  await exigirPuedeMensajear(usuarioId, rol, destinatario);

  const existente = await prisma.conversacion.findFirst({
    where: {
      AND: [
        { miembros: { some: { usuario_id: usuarioId } } },
        { miembros: { some: { usuario_id: destinatario.id } } },
        // Solo reutiliza conversaciones individuales entre estas dos personas.
        { miembros: { every: { usuario_id: { in: [usuarioId, destinatario.id] } } } },
      ],
    },
  });

  const conversacionId =
    existente?.id ??
    (
      await prisma.conversacion.create({
        data: {
          miembros: {
            create: [{ usuario_id: usuarioId }, { usuario_id: destinatario.id }],
          },
        },
      })
    ).id;

  const mensaje = await prisma.mensajeDirecto.create({
    data: {
      conversacion_id: conversacionId,
      emisor_id: usuarioId,
      contenido: input.contenido,
    },
  });

  await crearNoLeidas({
    usuario_id: destinatario.id,
    tipo: "MENSAJE",
    titulo: "Nuevo mensaje",
    mensaje: input.contenido,
    referencia_tipo: "conversacion",
    referencia_id: conversacionId,
  });

  return {
    id: mensaje.id,
    conversacion_id: conversacionId,
    contenido: mensaje.contenido,
    enviado_en: mensaje.enviado_en,
  };
}

export async function enviarBroadcast(usuarioId: string, input: BroadcastInput) {
  const destinatarios = await prisma.usuario.findMany({
    where: { activo: true, rol: input.dirigido_a ?? undefined },
  });

  const broadcast = await prisma.mensajeBroadcast.create({
    data: {
      emisor_id: usuarioId,
      titulo: input.titulo,
      contenido: input.contenido,
      dirigido_a: input.dirigido_a,
    },
  });

  if (destinatarios.length > 0) {
    await prisma.notificacion.createMany({
      data: destinatarios.map((u) => ({
        usuario_id: u.id,
        tipo: "MENSAJE" as const,
        titulo: input.titulo,
        mensaje: input.contenido,
        referencia_tipo: "broadcast",
        referencia_id: broadcast.id,
      })),
    });
  }

  return {
    id: broadcast.id,
    titulo: broadcast.titulo,
    contenido: broadcast.contenido,
    dirigido_a: broadcast.dirigido_a,
    enviado_en: broadcast.enviado_en,
    destinatarios: destinatarios.length,
  };
}
