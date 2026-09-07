import { api } from "./api";
import type { AdminUser, UserRole } from "../types/domain";

export interface AdminProfessor {
  id: string;
  nombre: string;
  email: string;
}

export type AdminRolInput = "ALUMNO" | "PROFESOR" | "ADMIN";

interface AdminUserApi {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  tipo_profesor: string | null;
  profesor_id: string | null;
  inscripciones: number;
  created_at: string;
}

const ROLE_MAP: Record<string, UserRole> = { PROFESOR: "Docente", ADMIN: "Admin", ALUMNO: "Alumno" };

function toAdminUser(u: AdminUserApi): AdminUser {
  return {
    id: u.id,
    name: u.nombre,
    email: u.email,
    role: ROLE_MAP[u.rol] ?? "Alumno",
    status: u.activo ? "Activo" : "Inactivo",
  };
}

// GET /api/admin/users — listado paginado (traemos hasta 100).
export async function getAdminUsers(): Promise<AdminUser[]> {
  const data = await api<{ items: AdminUserApi[] }>("/api/admin/users?pageSize=100");
  return (data.items ?? []).map(toAdminUser);
}

// GET /api/admin/users?rol=PROFESOR — docentes para asignar a materias.
// Se usa profesor_id (id del perfil docente) porque el backend asigna por esa tabla.
export async function getAdminProfessors(): Promise<AdminProfessor[]> {
  const data = await api<{ items: AdminUserApi[] }>("/api/admin/users?pageSize=100&rol=PROFESOR");
  return (data.items ?? []).map((u) => ({ id: u.profesor_id ?? u.id, nombre: u.nombre, email: u.email }));
}

// POST /api/admin/users — alta de usuario.
export async function createAdminUser(input: {
  nombre: string;
  email: string;
  password: string;
  rol: AdminRolInput;
  tipoProfesor?: string;
}): Promise<AdminUser> {
  const data = await api<{ usuario: AdminUserApi }>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify({
      nombre: input.nombre,
      email: input.email,
      password: input.password,
      rol: input.rol,
      tipo_profesor: input.rol === "PROFESOR" ? input.tipoProfesor ?? undefined : undefined,
    }),
  });
  return toAdminUser(data.usuario);
}

// PATCH /api/admin/users/:id/estado — activar/desactivar.
export async function setAdminUserActive(usuarioId: string, activo: boolean): Promise<AdminUser> {
  const data = await api<{ usuario: AdminUserApi }>(`/api/admin/users/${usuarioId}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ activo }),
  });
  return toAdminUser(data.usuario);
}

// PATCH /api/admin/users/:id/rol — cambio de rol.
export async function changeAdminUserRole(
  usuarioId: string,
  rol: AdminRolInput,
  tipoProfesor?: string
): Promise<AdminUser> {
  const data = await api<{ usuario: AdminUserApi }>(`/api/admin/users/${usuarioId}/rol`, {
    method: "PATCH",
    body: JSON.stringify({
      rol,
      tipo_profesor: rol === "PROFESOR" ? tipoProfesor ?? undefined : undefined,
    }),
  });
  return toAdminUser(data.usuario);
}