import { api } from "./api";
import { setAccessToken } from "./authToken";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  lastName: string;
  role: "ALUMNO" | "PROFESOR" | "ADMIN";
}

interface PublicUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: "ALUMNO" | "PROFESOR" | "ADMIN";
}

interface LoginResponse {
  accessToken: string;
  usuario: PublicUsuario;
}

function mapUsuario(u: PublicUsuario): AuthUser {
  return {
    id: u.id,
    username: u.email,
    name: u.nombre,
    lastName: "",
    role: u.rol,
  };
}

export async function loginRequest(email: string, password: string): Promise<AuthUser> {
  const data = await api<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(data.accessToken);
  return mapUsuario(data.usuario);
}

export async function meRequest(): Promise<AuthUser> {
  const data = await api<{ usuario: PublicUsuario }>("/api/auth/me");
  return mapUsuario(data.usuario);
}

export async function logoutRequest(): Promise<void> {
  try {
    await api<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
  } finally {
    setAccessToken(null);
  }
}
