import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Usuario } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { signAccessToken } from "../../middlewares/auth";
import { AppError } from "../../middlewares/error";
import type { LoginInput, RegisterInput } from "./auth.schemas";

const REFRESH_COOKIE = "eduai_refresh";
export const refreshCookieName = REFRESH_COOKIE;

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  usuario: PublicUsuario;
}

export interface PublicUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

function toPublic(usuario: Usuario): PublicUsuario {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateRefreshToken(): string {
  return randomBytes(48).toString("hex");
}

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

export async function register(input: RegisterInput): Promise<PublicUsuario> {
  const existe = await prisma.usuario.findUnique({ where: { email: input.email } });

  if (existe) {
    throw new AppError(409, "Ya existe una cuenta con ese email");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const usuario = await prisma.usuario.create({
    data: {
      nombre: input.nombre,
      email: input.email,
      password_hash: passwordHash,
      rol: "ALUMNO",
    },
  });

  return toPublic(usuario);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const usuario = await prisma.usuario.findUnique({ where: { email: input.email } });

  if (!usuario || !usuario.activo) {
    throw new AppError(401, "Credenciales incorrectas");
  }

  const passwordOk = await bcrypt.compare(input.password, usuario.password_hash);

  if (!passwordOk) {
    throw new AppError(401, "Credenciales incorrectas");
  }

  const refreshToken = generateRefreshToken();

  await prisma.sesion.create({
    data: {
      usuario_id: usuario.id,
      token_hash: hashToken(refreshToken),
      expires_at: new Date(Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken: signAccessToken({ sub: usuario.id, email: usuario.email, rol: usuario.rol }),
    refreshToken,
    usuario: toPublic(usuario),
  };
}

export async function refresh(refreshToken: string | undefined): Promise<AuthResult> {
  if (!refreshToken) {
    throw new AppError(401, "Sesion expirada. Volve a iniciar sesion");
  }

  const sesion = await prisma.sesion.findUnique({
    where: { token_hash: hashToken(refreshToken) },
    include: { usuario: true },
  });

  if (!sesion || sesion.revocado || sesion.expires_at < new Date()) {
    throw new AppError(401, "Sesion invalida o expirada. Volve a iniciar sesion");
  }

  if (!sesion.usuario.activo) {
    throw new AppError(403, "Cuenta desactivada");
  }

  const usuario = sesion.usuario;

  return {
    accessToken: signAccessToken({ sub: usuario.id, email: usuario.email, rol: usuario.rol }),
    refreshToken,
    usuario: toPublic(usuario),
  };
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) {
    return;
  }
  await prisma.sesion.updateMany({
    where: { token_hash: hashToken(refreshToken), revocado: false },
    data: { revocado: true },
  });
}

export async function me(userId: string): Promise<PublicUsuario> {
  const usuario = await prisma.usuario.findUnique({ where: { id: userId } });

  if (!usuario || !usuario.activo) {
    throw new AppError(404, "Usuario no encontrado");
  }

  return toPublic(usuario);
}
