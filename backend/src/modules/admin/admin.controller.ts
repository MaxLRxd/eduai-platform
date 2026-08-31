import { Request, Response } from "express";
import * as adminService from "./admin.service";
import type {
  ActualizarEstadoInput,
  ActualizarMateriaAdminInput,
  AsignarProfesorInput,
  CambiarRolInput,
  CrearMateriaAdminInput,
  CrearUsuarioInput,
} from "./admin.schemas";
import { AppError } from "../../middlewares/error";

function requireUser(req: Request<any, any, any, any>) {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  return req.user;
}

function parsePaginacion(query: { page?: string; pageSize?: string }) {
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize ?? "20", 10) || 20));
  return { page, pageSize };
}

export async function listarUsuarios(
  req: Request<unknown, unknown, unknown, { page?: string; pageSize?: string; rol?: string; activo?: string }>,
  res: Response
): Promise<void> {
  requireUser(req);
  const { page, pageSize } = parsePaginacion(req.query);
  const rol = req.query.rol;
  const activo = req.query.activo === undefined ? undefined : req.query.activo === "true";
  const resultado = await adminService.listarUsuarios(page, pageSize, rol, activo);
  res.json(resultado);
}

export async function crearUsuario(
  req: Request<unknown, unknown, CrearUsuarioInput>,
  res: Response
): Promise<void> {
  requireUser(req);
  const usuario = await adminService.crearUsuario(req.body);
  res.status(201).json({ usuario });
}

export async function actualizarEstado(
  req: Request<{ usuarioId: string }, unknown, ActualizarEstadoInput>,
  res: Response
): Promise<void> {
  const user = requireUser(req);
  const usuario = await adminService.actualizarEstado(req.params.usuarioId, req.body, user.id);
  res.json({ usuario });
}

export async function cambiarRol(
  req: Request<{ usuarioId: string }, unknown, CambiarRolInput>,
  res: Response
): Promise<void> {
  requireUser(req);
  const usuario = await adminService.cambiarRol(req.params.usuarioId, req.body);
  res.json({ usuario });
}

export async function listarMaterias(
  req: Request<unknown, unknown, unknown, { page?: string; pageSize?: string }>,
  res: Response
): Promise<void> {
  requireUser(req);
  const { page, pageSize } = parsePaginacion(req.query);
  const resultado = await adminService.listarMaterias(page, pageSize);
  res.json(resultado);
}

export async function crearMateria(
  req: Request<unknown, unknown, CrearMateriaAdminInput>,
  res: Response
): Promise<void> {
  requireUser(req);
  const materia = await adminService.crearMateria(req.body);
  res.status(201).json({ materia });
}

export async function actualizarMateria(
  req: Request<{ materiaId: string }, unknown, ActualizarMateriaAdminInput>,
  res: Response
): Promise<void> {
  requireUser(req);
  const materia = await adminService.actualizarMateria(req.params.materiaId, req.body);
  res.json({ materia });
}

export async function asignarProfesor(
  req: Request<{ materiaId: string }, unknown, AsignarProfesorInput>,
  res: Response
): Promise<void> {
  requireUser(req);
  const asignacion = await adminService.asignarProfesor(req.params.materiaId, req.body);
  res.status(201).json({ asignacion });
}
