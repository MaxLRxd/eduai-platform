import { Request, Response } from "express";
import * as dashboardService from "./dashboard.service";
import { AppError } from "../../middlewares/error";

function requireUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  return req.user;
}

function periodoDeQuery(req: Request): string | undefined {
  return typeof req.query.periodo === "string" && req.query.periodo.trim()
    ? req.query.periodo.trim()
    : undefined;
}

export async function dashboard(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await dashboardService.dashboard(user.id, user.rol, periodoDeQuery(req));
  res.json(data);
}

export async function dashboardAlumno(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await dashboardService.dashboardAlumno(user.id, periodoDeQuery(req));
  res.json(data);
}

export async function dashboardProfesor(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await dashboardService.dashboardProfesor(user.id);
  res.json(data);
}
