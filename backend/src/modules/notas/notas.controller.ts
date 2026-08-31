import { Request, Response } from "express";
import * as notasService from "./notas.service";
import type { ActualizarNotaInput, CrearNotaInput } from "./notas.schemas";
import { AppError } from "../../middlewares/error";

export async function listarPorMateria(
  req: Request<{ materiaId: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const notas = await notasService.listarPorMateria(req.params.materiaId, req.user.id, req.user.rol);
  res.json({ notas });
}

export async function crear(
  req: Request<{ materiaId: string }, unknown, CrearNotaInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const nota = await notasService.crear(req.params.materiaId, req.body, req.user.id);
  res.status(201).json({ nota });
}

export async function actualizar(
  req: Request<{ notaId: string }, unknown, ActualizarNotaInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const nota = await notasService.actualizar(req.params.notaId, req.body, req.user.id);
  res.json({ nota });
}

export async function mías(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const notas = await notasService.listarMias(req.user.id, req.user.rol);
  res.json({ notas });
}