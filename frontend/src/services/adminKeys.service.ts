import { api } from "./api";
import type { EnrollmentKeyAdmin } from "../types/domain";

interface EnrollmentKeyApi {
  id: string;
  materia_id: string;
  materia_nombre: string;
  codigo: string;
  estado: "activa" | "revocada";
  vencimiento: string | null;
  max_usos: number | null;
  usos: number;
  inscriptos: string[];
}

function toEnrollmentKey(k: EnrollmentKeyApi): EnrollmentKeyAdmin {
  return {
    id: k.id,
    materiaId: k.materia_id,
    materiaNombre: k.materia_nombre,
    codigo: k.codigo,
    estado: k.estado,
    vencimiento: k.vencimiento ? k.vencimiento.slice(0, 10) : null,
    maxUsos: k.max_usos,
    usos: k.usos,
    inscriptos: k.inscriptos,
  };
}

// GET /api/admin/enrollment-keys — listado de claves (filtro por materia opcional).
export async function getAdminKeys(): Promise<EnrollmentKeyAdmin[]> {
  const data = await api<{ items: EnrollmentKeyApi[] }>("/api/admin/enrollment-keys");
  return (data.items ?? []).map(toEnrollmentKey);
}

export interface NewKeyInput {
  materiaId: string;
  materiaNombre: string;
  vencimiento: string | null;
  maxUsos: number | null;
}

// POST /api/admin/enrollment-keys — genera una clave para una materia.
export async function generateAdminKey(input: NewKeyInput): Promise<EnrollmentKeyAdmin> {
  const data = await api<{ clave: EnrollmentKeyApi }>("/api/admin/enrollment-keys", {
    method: "POST",
    body: JSON.stringify({
      materia_id: input.materiaId,
      max_usos: input.maxUsos ?? undefined,
      vencimiento: input.vencimiento ? new Date(input.vencimiento).toISOString() : undefined,
    }),
  });
  return toEnrollmentKey(data.clave);
}

// PATCH /api/admin/enrollment-keys/:claveId/revocar — revoca una clave activa.
export async function revokeAdminKey(claveId: string): Promise<EnrollmentKeyAdmin> {
  const data = await api<{ clave: EnrollmentKeyApi }>(`/api/admin/enrollment-keys/${claveId}/revocar`, {
    method: "PATCH",
  });
  return toEnrollmentKey(data.clave);
}