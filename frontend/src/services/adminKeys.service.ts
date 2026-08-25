import type { EnrollmentKeyAdmin } from "../types/domain";
import { MOCK_ADMIN_KEYS } from "../data/mock/adminKeys.mock";

// TODO(backend): GET /api/admin/enrollment-keys?subjectId=... (CU-AD04).
export async function getAdminKeys(): Promise<EnrollmentKeyAdmin[]> {
  return Promise.resolve(MOCK_ADMIN_KEYS);
}

export interface NewKeyInput {
  materiaId: string;
  materiaNombre: string;
  vencimiento: string | null;
  maxUsos: number | null;
}

// TODO(backend): POST /api/admin/enrollment-keys.
export async function generateAdminKey(input: NewKeyInput): Promise<EnrollmentKeyAdmin> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const codigoBase = input.materiaNombre
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  return {
    id: Date.now(),
    materiaId: input.materiaId,
    materiaNombre: input.materiaNombre,
    codigo: `${codigoBase}-${new Date().getFullYear()}`,
    estado: "activa",
    vencimiento: input.vencimiento,
    maxUsos: input.maxUsos,
    usos: 0,
    inscriptos: [],
  };
}
