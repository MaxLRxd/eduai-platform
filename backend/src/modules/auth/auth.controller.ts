import { Request, Response } from "express";
import * as authService from "./auth.service";
import * as recuperacion from "./recuperacion.service";
import type {
  CambiarPasswordInput,
  LoginInput,
  OlvidePasswordInput,
  RegisterInput,
  RestablecerPasswordInput,
} from "./auth.schemas";
import { AppError } from "../../middlewares/error";

export async function register(
  req: Request<unknown, unknown, RegisterInput>,
  res: Response
): Promise<void> {
  const usuario = await authService.register(req.body);
  res.status(201).json({ usuario });
}

export async function login(
  req: Request<unknown, unknown, LoginInput>,
  res: Response
): Promise<void> {
  const { accessToken, refreshToken, usuario } = await authService.login(req.body);

  res.cookie(authService.refreshCookieName, refreshToken, authService.refreshCookieOptions());
  res.json({ accessToken, usuario });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[authService.refreshCookieName] as string | undefined;
  const { accessToken, refreshToken, usuario } = await authService.refresh(token);

  res.cookie(authService.refreshCookieName, refreshToken, authService.refreshCookieOptions());
  res.json({ accessToken, usuario });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[authService.refreshCookieName] as string | undefined;
  await authService.logout(token);

  res.clearCookie(authService.refreshCookieName, { path: "/api/auth" });
  res.json({ ok: true });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const usuario = await authService.me(req.user.id);
  res.json({ usuario });
}

export async function cambiarPassword(
  req: Request<unknown, unknown, CambiarPasswordInput>,
  res: Response
): Promise<void> {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }
  const token = req.cookies?.[authService.refreshCookieName] as string | undefined;
  await authService.cambiarPassword(req.user.id, req.body, token);
  res.json({ ok: true });
}

const RESPUESTA_OLVIDE =
  "Si el email corresponde a una cuenta, te enviamos un enlace para restablecer la contraseña.";

export async function olvidePassword(
  req: Request<unknown, unknown, OlvidePasswordInput>,
  res: Response
): Promise<void> {
  await recuperacion.solicitarRecuperacion(req.body.email);
  // Siempre la misma respuesta: no se revela si la cuenta existe.
  res.json({ ok: true, mensaje: RESPUESTA_OLVIDE });
}

export async function restablecerPassword(
  req: Request<unknown, unknown, RestablecerPasswordInput>,
  res: Response
): Promise<void> {
  await recuperacion.restablecerPassword(req.body.token, req.body.password_nueva);
  res.json({ ok: true });
}
