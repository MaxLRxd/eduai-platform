import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Rol } from "@prisma/client";
import { env } from "../config/env";
import { AppError } from "./error";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  rol: Rol;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" } as jwt.SignOptions);
}

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Token de acceso faltante"));
  }

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as AccessTokenPayload;
    req.user = { id: payload.sub, email: payload.email, rol: payload.rol };
    next();
  } catch {
    next(new AppError(401, "Token invalido o expirado"));
  }
}

export function requireRole(...roles: Rol[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, "No autenticado"));
    }
    if (!roles.includes(req.user.rol)) {
      return next(new AppError(403, "No autorizado para este recurso"));
    }
    next();
  };
}
