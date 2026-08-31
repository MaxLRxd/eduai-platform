import { Request, Response } from "express";
import * as correccionService from "./correccion.service";
import { AppError } from "../../middlewares/error";

export async function generarCorreccionIA(
  req: Request<{ entregaId: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const resultado = await correccionService.generarCorreccionIA(req.params.entregaId, req.user.id);
  res.json(resultado);
}
