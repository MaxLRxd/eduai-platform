import { Request, Response } from "express";
import * as analyticsService from "./analytics.service";
import type {
  ActualizarPreguntaFrecuenteInput,
  CrearPreguntaFrecuenteInput,
} from "./analytics.schemas";
import { AppError } from "../../middlewares/error";

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  return req.user;
}

export async function comprension(
  req: Request<{ materiaId: string }>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const data = await analyticsService.listarComprension(
    req.params.materiaId,
    user.id,
    user.rol
  );
  res.json({ comprension: data });
}

export async function riesgo(
  req: Request<{ materiaId: string }>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const data = await analyticsService.listarRiesgo(req.params.materiaId, user.id, user.rol);
  res.json({ alertas: data });
}

export async function dudas(
  req: Request<{ materiaId: string }>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const data = await analyticsService.listarDudas(req.params.materiaId, user.id, user.rol);
  res.json({ dudas: data });
}

export async function listarPreguntas(
  req: Request<{ materiaId: string }>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const data = await analyticsService.listarPreguntasFrecuentes(
    req.params.materiaId,
    user.id,
    user.rol
  );
  res.json({ preguntas: data });
}

export async function crearPregunta(
  req: Request<{ materiaId: string }, unknown, CrearPreguntaFrecuenteInput>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const pregunta = await analyticsService.crearPreguntaFrecuente(
    req.params.materiaId,
    req.body,
    user.id
  );
  res.status(201).json({ pregunta });
}

export async function actualizarPregunta(
  req: Request<{ preguntaId: string }, unknown, ActualizarPreguntaFrecuenteInput>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const pregunta = await analyticsService.actualizarPreguntaFrecuente(
    req.params.preguntaId,
    req.body,
    user.id
  );
  res.json({ pregunta });
}

export async function eliminarPregunta(
  req: Request<{ preguntaId: string }>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const resultado = await analyticsService.eliminarPreguntaFrecuente(
    req.params.preguntaId,
    user.id
  );
  res.json(resultado);
}
