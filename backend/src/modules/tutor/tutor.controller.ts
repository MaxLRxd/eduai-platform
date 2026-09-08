import { Request, Response } from "express";
import { Readable, Transform } from "node:stream";
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

function extraerTextoSse(sse: string): string {
  let texto = "";
  for (const linea of sse.split("\n")) {
    const line = linea.trim();
    if (!line.startsWith("data:")) continue;
    try {
      const payload = JSON.parse(line.slice(5).trim()) as { type?: string; text?: string };
      if (payload.type === "token" && payload.text) {
        texto += payload.text;
      }
    } catch {
      // ignora lineas de datos no parseables
    }
  }
  return texto;
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

  await tutorService.registrarMensajeUsuario(req.params.sesionId, req.body.contenido, req.user.id);

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

  const inicio = Date.now();
  const fragmentosSse: string[] = [];

  const acumulador = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      fragmentosSse.push(chunk.toString("utf8"));
      callback(null, chunk);
    },
  });

  try {
    await pipeline(upstreamStream, acumulador, res);
  } catch {
    res.end();
  }

  const respuestaTexto = extraerTextoSse(fragmentosSse.join(""));

  if (respuestaTexto.trim()) {
    try {
      await tutorService.registrarRespuestaStream(
        req.params.sesionId,
        respuestaTexto,
        Date.now() - inicio,
        req.user.id
      );
    } catch {
      // si no se pudo persistir, el cliente ya recibió el streaming
    }
  }
}