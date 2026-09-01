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
