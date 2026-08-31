import { Request, Response } from "express";
import * as seccionesService from "./secciones.service";
import type {
  ActualizarSeccionInput,
  CrearSeccionInput,
} from "./secciones.schemas";
import { AppError } from "../../middlewares/error";

export async function listarPorMateria(
  req: Request<{ materiaId: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const secciones = await seccionesService.listarPorMateria(
    req.params.materiaId,
    req.user.id,
    req.user.rol
  );
  res.json({ secciones });
}

export async function crear(
  req: Request<{ materiaId: string }, unknown, CrearSeccionInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const seccion = await seccionesService.crear(req.params.materiaId, req.body, req.user.id);
  res.status(201).json({ seccion });
}

export async function actualizar(
  req: Request<{ seccionId: string }, unknown, ActualizarSeccionInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const seccion = await seccionesService.actualizar(req.params.seccionId, req.body, req.user.id);
  res.json({ seccion });
}

export async function eliminar(
  req: Request<{ seccionId: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const resultado = await seccionesService.eliminar(req.params.seccionId, req.user.id);
  res.json(resultado);
}
