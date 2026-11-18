import { Request, Response } from "express";
import * as analyticsService from "./analytics.service";
import type {
  ActualizarPreguntaFrecuenteInput,
  CrearPreguntaFrecuenteInput,
} from "./analytics.schemas";
import { AppError } from "../../middlewares/error";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Lee ?periodo= y ?seccion_id= (un uuid o "general"); un valor invalido es un error, no se ignora en silencio. */
function filtrosDe(query: Request["query"]): analyticsService.FiltrosAnalytics {
  const periodo = typeof query.periodo === "string" && query.periodo.trim() ? query.periodo.trim() : undefined;
  const seccion = typeof query.seccion_id === "string" && query.seccion_id.trim() ? query.seccion_id.trim() : undefined;

  if (periodo && periodo.length > 50) {
    throw new AppError(400, "Periodo invalido");
  }
  if (seccion && seccion !== "general" && !UUID.test(seccion)) {
    throw new AppError(400, "Unidad invalida");
  }
  return { periodo, seccion_id: seccion };
}

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  return req.user;
}

export async function comprension(
  req: Request<{ materiaId: string }>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const data = await analyticsService.listarComprension(
    req.params.materiaId,
    user.id,
    user.rol,
    filtrosDe(req.query)
  );
  res.json(data);
}

export async function riesgo(
  req: Request<{ materiaId: string }>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const data = await analyticsService.listarRiesgo(req.params.materiaId, user.id, user.rol);
  res.json({ alertas: data });
}

export async function dudas(
  req: Request<{ materiaId: string }>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const data = await analyticsService.listarDudas(req.params.materiaId, user.id, user.rol, filtrosDe(req.query));
  res.json({ dudas: data });
}

export async function listarPreguntas(
  req: Request<{ materiaId: string }>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const data = await analyticsService.listarPreguntasFrecuentes(
    req.params.materiaId,
    user.id,
    user.rol
  );
  res.json({ preguntas: data });
}

export async function progreso(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);

  if (user.rol !== "ALUMNO") {
    throw new AppError(403, "Solo los alumnos tienen progreso academico");
  }

  const periodo =
    typeof req.query.periodo === "string" && req.query.periodo.trim()
      ? req.query.periodo.trim()
      : undefined;
  const data = await analyticsService.progresoAlumno(user.id, periodo);
  res.json(data);
}

export async function crearPregunta(
  req: Request<{ materiaId: string }, unknown, CrearPreguntaFrecuenteInput>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const pregunta = await analyticsService.crearPreguntaFrecuente(
    req.params.materiaId,
    req.body,
    user.id
  );
  res.status(201).json({ pregunta });
}

export async function actualizarPregunta(
  req: Request<{ preguntaId: string }, unknown, ActualizarPreguntaFrecuenteInput>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const pregunta = await analyticsService.actualizarPreguntaFrecuente(
    req.params.preguntaId,
    req.body,
    user.id
  );
  res.json({ pregunta });
}

export async function eliminarPregunta(
  req: Request<{ preguntaId: string }>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const resultado = await analyticsService.eliminarPreguntaFrecuente(
    req.params.preguntaId,
    user.id
  );
  res.json(resultado);
}
