import { Request, Response } from "express";
import * as contenidosService from "./contenidos.service";
import type {
  ActualizarContenidoInput,
  CrearContenidoInput,
} from "./contenidos.schemas";
import { AppError } from "../../middlewares/error";

export async function listarPorSeccion(
  req: Request<{ seccionId: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const contenidos = await contenidosService.listarPorSeccion(
    req.params.seccionId,
    req.user.id,
    req.user.rol
  );
  res.json({ contenidos });
}

export async function crear(
  req: Request<{ seccionId: string }, unknown, CrearContenidoInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const contenido = await contenidosService.crear(req.params.seccionId, req.body, req.user.id);
  res.status(201).json({ contenido });
}

export async function actualizar(
  req: Request<{ contenidoId: string }, unknown, ActualizarContenidoInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const contenido = await contenidosService.actualizar(
    req.params.contenidoId,
    req.body,
    req.user.id
  );
  res.json({ contenido });
}

export async function eliminar(
  req: Request<{ contenidoId: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const resultado = await contenidosService.eliminar(req.params.contenidoId, req.user.id);
  res.json(resultado);
}
