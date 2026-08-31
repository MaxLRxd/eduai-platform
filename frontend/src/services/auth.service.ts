import { api, setAccessToken } from "./api";
import type { Role } from "../contexts/AuthContext";

export interface BackendUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

export interface LoginResponse {
  accessToken: string;
  usuario: BackendUsuario;
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const data = await api<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function meRequest(): Promise<BackendUsuario> {
  const data = await api<{ usuario: BackendUsuario }>("/api/auth/me");
  return data.usuario;
}

export async function refreshRequest(): Promise<LoginResponse> {
  const data = await api<LoginResponse>("/api/auth/refresh", { method: "POST" });
  setAccessToken(data.accessToken);
  return data;
}

export async function logoutRequest(): Promise<void> {
  try {
    await api<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
  } finally {
    setAccessToken(null);
  }
}

function toFrontendRole(rol: string): Role {
  if (rol === "PROFESOR") return "PROFESOR";
  if (rol === "ADMIN") return "ADMIN";
  return "ALUMNO";
}
