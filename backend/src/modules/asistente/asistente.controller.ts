import { Request, Response } from "express";
import * as asistenteService from "./asistente.service";
import { AppError } from "../../middlewares/error";
import {
  crearSesionDocenteSchema,
  CrearSesionDocenteInput,
  GenerarMaterialInput,
  generarMaterialSchema,
  MaterialPdfInput,
  MensajeDocenteInput,
  mensajeDocenteSchema,
} from "./asistente.schemas";

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

export async function crearSesionDocente(
  req: Request<unknown, unknown, CrearSesionDocenteInput>,
  res: Response
): Promise<void> {
  if (!req.user) throw new AppError(401, "No autenticado");
  const parsed = crearSesionDocenteSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, "Datos invalidos");
  res.json(await asistenteService.crearSesionDocente(parsed.data.materia_id, parsed.data, req.user.id));
}

export async function listarSesionesDocente(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, "No autenticado");
  const materiaId = String(req.query.materia_id ?? "");
  if (!materiaId) throw new AppError(400, "Falta materia_id");
  res.json(await asistenteService.listarSesionesDocente(materiaId, req.user.id));
}

export async function listarMensajesDocente(req: Request<{ id: string }>, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, "No autenticado");
  res.json(await asistenteService.listarMensajesDocente(req.params.id, req.user.id));
}

export async function enviarMensajeDocente(
  req: Request<{ id: string }, unknown, MensajeDocenteInput>,
  res: Response
): Promise<void> {
  if (!req.user) throw new AppError(401, "No autenticado");
  const parsed = mensajeDocenteSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, "Datos invalidos");
  res.json(await asistenteService.enviarMensajeDocente(req.params.id, parsed.data, req.user.id));
}
