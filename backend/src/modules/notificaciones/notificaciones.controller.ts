import { Request, Response } from "express";
import * as notificacionesService from "./notificaciones.service";
import { AppError } from "../../middlewares/error";

export async function listar(
  req: Request<unknown, unknown, unknown, { noLeidas?: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const soloNoLeidas = req.query.noLeidas === "true";
  const notificaciones = await notificacionesService.listarMias(req.user.id, soloNoLeidas);
  res.json({ notificaciones });
}

export async function contarNoLeidas(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const count = await notificacionesService.contarNoLeidas(req.user.id);
  res.json({ count });
}

export async function marcarLeida(
  req: Request<{ notificacionId: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const notificacion = await notificacionesService.marcarLeida(
    req.params.notificacionId,
    req.user.id
  );
  res.json({ notificacion });
}

export async function marcarTodasLeidas(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const resultado = await notificacionesService.marcarTodasLeidas(req.user.id);
  res.json(resultado);
}
