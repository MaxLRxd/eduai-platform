import { Request, Response } from "express";
import * as authService from "./auth.service";
import type { LoginInput, RegisterInput } from "./auth.schemas";
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
