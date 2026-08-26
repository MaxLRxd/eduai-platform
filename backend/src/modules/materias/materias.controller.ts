import { Request, Response } from "express";
import * as materiasService from "./materias.service";
import type { CreateMateriaInput, CrearClaveInput, UnirseInput } from "./materias.schemas";
import { AppError } from "../../middlewares/error";

export async function crear(
  req: Request<unknown, unknown, CreateMateriaInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const materia = await materiasService.crear(req.body, req.user.id);
  res.status(201).json({ materia });
}

export async function mias(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const materias = await materiasService.listarMias(req.user.id, req.user.rol);
  res.json({ materias });
}

export async function detalle(req: Request<{ id: string }>, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const materia = await materiasService.obtenerDetalle(req.params.id, req.user.id, req.user.rol);
  res.json({ materia });
}

export async function crearClave(
  req: Request<{ id: string }, unknown, CrearClaveInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const clave = await materiasService.crearClave(req.params.id, req.body, req.user.id);
  res.status(201).json({ clave });
}

export async function unirse(
  req: Request<unknown, unknown, UnirseInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const materia = await materiasService.unirse(req.body, req.user.id);
  res.status(201).json({ materia });
}
