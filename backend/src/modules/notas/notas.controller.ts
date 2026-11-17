import { Request, Response } from "express";
import * as notasService from "./notas.service";
import type {
  ActualizarNotaInput,
  CategoriasNotaInput,
  CrearNotaInput,
  SincronizarActividadInput,
} from "./notas.schemas";
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

export async function listarFuentesCalificacion(
  req: Request<{ materiaId: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const alumnos = await notasService.listarFuentesCalificacion(req.params.materiaId, req.user.id);
  res.json({ alumnos });
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
export async function listarCategorias(req: Request<{ materiaId: string }>, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const categorias = await notasService.listarCategorias(req.params.materiaId, req.user.id, req.user.rol);
  res.json({ categorias });
}

export async function reemplazarCategorias(
  req: Request<{ materiaId: string }, unknown, CategoriasNotaInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const categorias = await notasService.reemplazarCategorias(req.params.materiaId, req.body, req.user.id);
  res.json({ categorias });
}

export async function resumenCalificaciones(
  req: Request<{ materiaId: string }, unknown, unknown, { periodo?: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const periodo = typeof req.query.periodo === "string" && req.query.periodo ? req.query.periodo : undefined;
  res.json(await notasService.resumenCalificaciones(req.params.materiaId, req.user.id, periodo));
}

export async function sincronizarDesdeActividad(
  req: Request<{ actividadId: string }, unknown, SincronizarActividadInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  res.json(await notasService.sincronizarDesdeActividad(req.params.actividadId, req.body, req.user.id));
}
