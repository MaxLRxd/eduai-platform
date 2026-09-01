import { Request, Response } from "express";
import * as messagesService from "./messages.service";
import type { BroadcastInput, EnviarMensajeInput } from "./messages.schemas";
import { AppError } from "../../middlewares/error";

function requireUser(req: Request<any, any, any, any>) {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  return req.user;
}

export async function listarConversaciones(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const items = await messagesService.listarConversaciones(user.id);
  res.json({ items });
}

export async function obtenerMensajes(
  req: Request<unknown, unknown, unknown, { conversacionId?: string }>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const conversacionId = req.query.conversacionId ?? "";
  const items = await messagesService.obtenerMensajes(conversacionId, user.id);
  res.json({ items });
}

export async function enviarMensaje(
  req: Request<unknown, unknown, EnviarMensajeInput>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const mensaje = await messagesService.enviarMensaje(user.id, req.body);
  res.status(201).json({ mensaje });
}

export async function enviarBroadcast(
  req: Request<unknown, unknown, BroadcastInput>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const broadcast = await messagesService.enviarBroadcast(user.id, req.body);
  res.status(201).json({ broadcast });
}
