import { MOCK_ENROLLMENT_KEYS } from "../data/mock/enrollment.mock";

export interface EnrollResult {
  success: boolean;
  message: string;
}

function sanitizeCode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

// TODO(backend): POST /api/enrollments con la clave (CU-A01 / CU-AD04).
export async function enrollWithCode(rawCode: string): Promise<EnrollResult> {
  const code = sanitizeCode(rawCode);
  const key = MOCK_ENROLLMENT_KEYS.find((k) => k.code === code);

  if (!key) {
    return { success: false, message: "La clave ingresada no existe. Verificala con tu docente." };
  }
  if (!key.active) {
    return { success: false, message: "Esa clave de matriculación fue revocada." };
  }
  return { success: true, message: `Te inscribiste correctamente a ${key.courseName}.` };
}
