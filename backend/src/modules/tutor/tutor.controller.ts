import { Request, Response } from "express";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import * as tutorService from "./tutor.service";
import { streamTutor } from "../../config/aiClient";
import type { CrearSesionInput, EnviarMensajeInput } from "./tutor.schemas";
import { AppError } from "../../middlewares/error";

export async function crearSesion(
  req: Request<{ materiaId: string }, unknown, CrearSesionInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const sesion = await tutorService.crearSesion(req.params.materiaId, req.body, req.user.id);
  res.status(201).json({ sesion });
}

export async function listarSesiones(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const sesiones = await tutorService.listarSesionesMias(req.user.id);
  res.json({ sesiones });
}

export async function listarMensajes(
  req: Request<{ sesionId: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const mensajes = await tutorService.listarMensajes(req.params.sesionId, req.user.id);
  res.json({ mensajes });
}

export async function enviarMensaje(
  req: Request<{ sesionId: string }, unknown, EnviarMensajeInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const resultado = await tutorService.enviarMensaje(req.params.sesionId, req.body, req.user.id);
  res.json(resultado);
}

export async function stream(
  req: Request<{ sesionId: string }, unknown, EnviarMensajeInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }

  const { materiaId, modo, history } = await tutorService.prepararStream(
    req.params.sesionId,
    req.body.contenido,
    req.user.id
  );

  const upstream = await streamTutor(materiaId, req.body.contenido, modo, history);

  if (!upstream || !upstream.body) {
    throw new AppError(502, "No se pudo iniciar el streaming del tutor en este momento");
  }

  if (!upstream.ok) {
    throw new AppError(502, "El servicio de IA devolvio un error al iniciar el streaming");
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const upstreamStream: Readable = Readable.fromWeb(upstream.body as import("node:stream/web").ReadableStream);

  try {
    await pipeline(upstreamStream, res);
  } catch {
    res.end();
  }
}
