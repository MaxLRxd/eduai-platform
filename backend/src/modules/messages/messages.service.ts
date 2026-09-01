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

  return mensajes.map((msg) => ({
    id: msg.id,
    emisor_id: msg.emisor_id,
    contenido: msg.contenido,
    leido: msg.leido,
    enviado_en: msg.enviado_en,
  }));
}

export async function enviarMensaje(usuarioId: string, input: EnviarMensajeInput) {
  assertUuid(input.destinatario_id, "Destinatario no encontrado");

  const destinatario = await prisma.usuario.findUnique({ where: { id: input.destinatario_id } });

  if (!destinatario) {
    throw new AppError(404, "Destinatario no encontrado");
  }

  if (destinatario.id === usuarioId) {
    throw new AppError(400, "No podes enviarte un mensaje a vos mismo");
  }

  const existente = await prisma.conversacion.findFirst({
    where: {
      AND: [
        { miembros: { some: { usuario_id: usuarioId } } },
        { miembros: { some: { usuario_id: destinatario.id } } },
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
