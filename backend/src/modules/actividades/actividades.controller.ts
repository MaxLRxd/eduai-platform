import { Request, Response } from "express";
import { AppError } from "../../middlewares/error";
import * as actividadesService from "./actividades.service";
import type {
  ActualizarActividadInput,
  ActualizarRubricaInput,
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

export async function eliminar(
  req: Request<{ actividadId: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const resultado = await actividadesService.eliminar(req.params.actividadId, req.user.id);
  res.json(resultado);
}

export async function subirArchivo(
  req: Request<{ actividadId: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  if (!req.file) {
    throw new AppError(400, "No se recibio ningun archivo");
  }
  const archivo = await actividadesService.subirArchivoEntrega(
    req.params.actividadId,
    req.user.id,
    req.file
  );
  res.status(201).json({ archivo });
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

export async function corregirConIA(
  req: Request<{ entregaId: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const entrega = await actividadesService.corregirConIA(req.params.entregaId, req.user.id);
  res.json({ entrega });
}

export async function actualizarRubrica(
  req: Request<{ rubricaId: string }, unknown, ActualizarRubricaInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const rubrica = await actividadesService.actualizarRubrica(
    req.params.rubricaId,
    req.body,
    req.user.id
  );
  res.json({ rubrica });
}

export async function eliminarRubrica(
  req: Request<{ rubricaId: string }>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const resultado = await actividadesService.eliminarRubrica(req.params.rubricaId, req.user.id);
  res.json(resultado);
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