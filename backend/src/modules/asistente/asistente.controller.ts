import { Request, Response } from "express";
import * as asistenteService from "./asistente.service";
import { AppError } from "../../middlewares/error";
import { generarMaterialSchema, GenerarMaterialInput, MaterialPdfInput } from "./asistente.schemas";

export async function generarMaterial(
  req: Request<unknown, unknown, GenerarMaterialInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const parsed = generarMaterialSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, "Datos invalidos");
  }
  const resultado = await asistenteService.generarMaterial(
    parsed.data.materia_id,
    parsed.data,
    req.user.id
  );
  res.json(resultado);
}

export async function generarMaterialPdf(
  req: Request<unknown, unknown, MaterialPdfInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const resultado = await asistenteService.generarMaterialPdf(req.body, req.user.id);
  res.json(resultado);
}
