import { Request, Response } from "express";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import * as tutorService from "./tutor.service";
import { streamTutor } from "../../config/aiClient";
import type {
  CorregirExamenInput,
  CrearSesionInput,
  EnviarMensajeInput,
  ExamenInput,
  ResumenInput,
  ResumenPdfInput,
} from "./tutor.schemas";
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

export async function resumen(
  req: Request<{ materiaId: string }, unknown, ResumenInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const resultado = await tutorService.resumir(req.params.materiaId, req.body, req.user.id);
  res.json(resultado);
}

export async function examen(
  req: Request<{ materiaId: string }, unknown, ExamenInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const resultado = await tutorService.generarSimulacro(req.params.materiaId, req.body, req.user.id);
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

  // El cronometro arranca al recibir el pedido: lo que mide es lo que espera el alumno.
  const inicioPedido = Date.now();

  const { materiaId, modo, modoSesion, history } = await tutorService.prepararStream(
    req.params.sesionId,
    req.body.contenido,
    req.user.id,
    req.body.modo
  );

  await tutorService.registrarMensajeUsuario(
    req.params.sesionId,
    req.body.contenido,
    req.user.id,
    modoSesion
  );

  // CU-A04 (A5.1): una pregunta frecuente se contesta sin llamar a la IA (solo en modo normal).
  const frecuente = modo === "normal" ? await tutorService.buscarPreguntaFrecuente(materiaId, req.body.contenido) : null;

  if (frecuente) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ type: "token", text: frecuente })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: "done", sources: [], cached: true, pregunta_frecuente: true })}\n\n`);
    res.end();

    try {
      await tutorService.registrarRespuestaPreguntaFrecuente(req.params.sesionId, frecuente, modoSesion);
    } catch {
      // el alumno ya recibio la respuesta; no se pudo guardar en el historial
    }
    return;
  }

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

  let primerTokenMs: number | undefined;
  const fragmentosSse: string[] = [];

  const acumulador = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      const texto = chunk.toString("utf8");
      fragmentosSse.push(texto);
      if (primerTokenMs === undefined && /"type":\s*"token"/.test(texto)) {
        primerTokenMs = Date.now() - inicioPedido;
      }
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
        Date.now() - inicioPedido,
        req.user.id,
        modoSesion,
        primerTokenMs
      );
    } catch {
      // si no se pudo persistir, el cliente ya recibió el streaming
    }
  }
}

export async function corregirSimulacro(
  req: Request<{ materiaId: string }, unknown, CorregirExamenInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  res.json(await tutorService.corregirSimulacro(req.params.materiaId, req.body, req.user.id));
}

export async function listarSimulacros(
  req: Request<{ materiaId: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  res.json({ simulacros: await tutorService.listarSimulacros(req.params.materiaId, req.user.id) });
}

export async function latenciaDeMateria(
  req: Request<{ materiaId: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  await tutorService.exigirDocenteDeMateria(req.params.materiaId, req.user.id);
  res.json(await tutorService.latenciaTutor(req.params.materiaId));
}

export async function latenciaGlobal(_req: Request, res: Response): Promise<void> {
  res.json(await tutorService.latenciaTutor(null));
}

export async function resumenAPdf(
  req: Request<{ materiaId: string }, unknown, ResumenPdfInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  res.json(await tutorService.resumenAPdf(req.params.materiaId, req.body, req.user.id));
}
