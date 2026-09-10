import { Request, Response } from "express";
import * as asistenteService from "./asistente.service";
import { AppError } from "../../middlewares/error";
import { generarMaterialSchema, GenerarMaterialInput } from "./asistente.schemas";

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