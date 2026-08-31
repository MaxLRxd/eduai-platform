import type { TipoNotificacion } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { AppError } from "../../middlewares/error";
import type { CrearNotificacionInput } from "./notificaciones.schemas";

interface Notificacion {
  id: string;
  usuario_id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  referencia_tipo: string | null;
  referencia_id: string | null;
  leida: boolean;
  creada_en: Date;
  leida_en: Date | null;
  usuario?: { id: string; nombre: string; email: string };
}

function toNotificacionDto(n: {
  id: string;
  usuario_id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  referencia_tipo: string | null;
  referencia_id: string | null;
  leida: boolean;
  creada_en: Date;
  leida_en: Date | null;
  usuario?: { id: string; nombre: string; email: string };
}): Notificacion {
  return {
    id: n.id,
    usuario_id: n.usuario_id,
    tipo: n.tipo,
    titulo: n.titulo,
    mensaje: n.mensaje,
    referencia_tipo: n.referencia_tipo,
    referencia_id: n.referencia_id,
    leida: n.leida,
    creada_en: n.creada_en,
    leida_en: n.leida_en,
    usuario: n.usuario,
  };
}

export async function crearNoLeidas(input: CrearNotificacionInput): Promise<Notificacion> {
  const notificacion = await prisma.notificacion.create({
    data: {
      usuario_id: input.usuario_id,
      tipo: input.tipo,
      titulo: input.titulo,
      mensaje: input.mensaje,
      referencia_tipo: input.referencia_tipo,
      referencia_id: input.referencia_id,
    },
  });

  return toNotificacionDto(notificacion);
}

export async function listarMias(usuarioId: string, soloNoLeidas: boolean) {
  const notificaciones = await prisma.notificacion.findMany({
    where: { usuario_id: usuarioId, ...(soloNoLeidas ? { leida: false } : {}) },
    orderBy: { creada_en: "desc" },
  });

  return notificaciones.map(toNotificacionDto);
}

export async function contarNoLeidas(usuarioId: string) {
  const count = await prisma.notificacion.count({
    where: { usuario_id: usuarioId, leida: false },
  });

  return count;
}

async function obtenerNotificacionUsuario(notificacionId: string, usuarioId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(notificacionId)) {
    throw new AppError(404, "Notificacion no encontrada");
  }

  const notificacion = await prisma.notificacion.findUnique({ where: { id: notificacionId } });

  if (!notificacion || notificacion.usuario_id !== usuarioId) {
    throw new AppError(404, "Notificacion no encontrada");
  }

  return notificacion;
}

export async function marcarLeida(notificacionId: string, usuarioId: string) {
  await obtenerNotificacionUsuario(notificacionId, usuarioId);

  const notificacion = await prisma.notificacion.update({
    where: { id: notificacionId },
    data: { leida: true, leida_en: new Date() },
  });

  return toNotificacionDto(notificacion);
}

export async function marcarTodasLeidas(usuarioId: string) {
  const resultado = await prisma.notificacion.updateMany({
    where: { usuario_id: usuarioId, leida: false },
    data: { leida: true, leida_en: new Date() },
  });

  return { marcadas: resultado.count };
}
