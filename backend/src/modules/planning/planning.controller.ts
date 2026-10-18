import { Request, Response } from "express";
import * as planningService from "./planning.service";
import type { UpsertPlanningInput } from "./planning.schemas";
import { AppError } from "../../middlewares/error";

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  return req.user;
}

export async function listarPlanning(
  req: Request<{ materiaId: string }>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const items = await planningService.listarPlanning(req.params.materiaId, user.id);
  res.json({ items });
}

export async function upsertPlanning(
  req: Request<{ materiaId: string; fecha: string }, unknown, UpsertPlanningInput>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const item = await planningService.upsertPlanning(
    req.params.materiaId,
    req.params.fecha,
    req.body,
    user.id
  );
  res.json({ item });
}

export async function subirMaterial(
  req: Request<{ materiaId: string; fecha: string }>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const archivo = req.file as Express.Multer.File | undefined;
  if (!archivo) {
    throw new AppError(400, "Archivo requerido (campo 'archivo')");
  }
  const item = await planningService.subirMaterial(
    req.params.materiaId,
    req.params.fecha,
    user.id,
    { buffer: archivo.buffer, nombreOriginal: archivo.originalname }
  );
  res.status(201).json({ item });
}

export async function eliminarMaterial(
  req: Request<{ materiaId: string; fecha: string }>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const item = await planningService.eliminarMaterial(
    req.params.materiaId,
    req.params.fecha,
    user.id
  );
  res.json({ item });
}
