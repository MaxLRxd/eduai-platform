import { Request, Response } from "express";
import * as asistenciasService from "./asistencias.service";
import type {
  ActualizarAsistenciaInput,
  RegistraAsistenciaInput,
} from "./asistencias.schemas";
import { AppError } from "../../middlewares/error";

export async function listarPorMateria(
  req: Request<{ materiaId: string }, unknown, unknown, { fecha?: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const asistencias = await asistenciasService.listarPorMateria(
    req.params.materiaId,
    req.query.fecha,
    req.user.id,
    req.user.rol
  );
  res.json({ asistencias });
}

export async function registrarDia(
  req: Request<{ materiaId: string }, unknown, RegistraAsistenciaInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const resultado = await asistenciasService.registrarDia(req.params.materiaId, req.body, req.user.id);
  res.status(201).json(resultado);
}

export async function actualizar(
  req: Request<{ asistenciaId: string }, unknown, ActualizarAsistenciaInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const asistencia = await asistenciasService.actualizar(
    req.params.asistenciaId,
    req.body,
    req.user.id
  );
  res.json({ asistencia });
}

export async function mías(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const asistencias = await asistenciasService.listarMias(req.user.id, req.user.rol);
  res.json({ asistencias });
}