import { Request, Response } from "express";
import { AppError } from "../../middlewares/error";
import * as actividadesService from "./actividades.service";
import type {
  ActualizarActividadInput,
  CorregirEntregaInput,
  CrearActividadInput,
  CrearRubricaInput,
  EnviarEntregaInput,
} from "./actividades.schemas";

export async function listarPorMateria(
  req: Request<{ materiaId: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const actividades = await actividadesService.listarPorMateria(
    req.params.materiaId,
    req.user.id,
    req.user.rol
  );
  res.json({ actividades });
}

export async function crear(
  req: Request<{ materiaId: string }, unknown, CrearActividadInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const actividad = await actividadesService.crear(req.params.materiaId, req.body, req.user.id);
  res.status(201).json({ actividad });
}

export async function actualizar(
  req: Request<{ actividadId: string }, unknown, ActualizarActividadInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const actividad = await actividadesService.actualizar(
    req.params.actividadId,
    req.body,
    req.user.id
  );
  res.json({ actividad });
}

export async function enviar(
  req: Request<{ actividadId: string }, unknown, EnviarEntregaInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const entrega = await actividadesService.enviar(req.params.actividadId, req.user.id, req.body);
  res.status(201).json({ entrega });
}

export async function listarEntregas(
  req: Request<{ actividadId: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const entregas = await actividadesService.listarEntregas(req.params.actividadId, req.user.id);
  res.json({ entregas });
}

export async function corregir(
  req: Request<{ entregaId: string }, unknown, CorregirEntregaInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const entrega = await actividadesService.corregir(req.params.entregaId, req.body, req.user.id);
  res.json({ entrega });
}

export async function listarPendientes(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const entregas = await actividadesService.listarPendientes(req.user.id);
  res.json({ entregas });
}

export async function listarRubricas(
  req: Request<{ materiaId: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const rubricas = await actividadesService.listarRubricas(req.params.materiaId, req.user.id);
  res.json({ rubricas });
}

export async function crearRubrica(
  req: Request<{ materiaId: string }, unknown, CrearRubricaInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const rubrica = await actividadesService.crearRubrica(
    req.params.materiaId,
    req.body,
    req.user.id
  );
  res.status(201).json({ rubrica });
}