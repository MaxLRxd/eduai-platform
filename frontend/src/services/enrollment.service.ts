import { api, ApiError } from "./api";

export interface EnrollResult {
  success: boolean;
  message: string;
}

function sanitizeCode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

function messageFromError(e: unknown): string {
  if (e instanceof ApiError) {
    try {
      const parsed = JSON.parse(e.message) as { error?: string };
      if (parsed.error) return parsed.error;
    } catch {
      // cuerpo no JSON: caemos al fallback
    }
    if (e.status === 409) return "Ya estás inscripto a esta materia.";
    if (e.status === 400) return "La clave no es válida, está vencida o alcanzó su límite de usos.";
    return "Ocurrió un error al inscribirte. Intentá de nuevo.";
  }
  return "Ocurrió un error al inscribirte. Intentá de nuevo.";
}

// POST /api/materias/unirse — inscripción por clave de matriculación (CU-A01).
export async function enrollWithCode(rawCode: string): Promise<EnrollResult> {
  const code = sanitizeCode(rawCode);

  try {
    const data = await api<{ materia: { nombre: string } }>("/api/materias/unirse", {
      method: "POST",
      body: JSON.stringify({ clave: code }),
    });
    return { success: true, message: `Te inscribiste correctamente a ${data.materia.nombre}.` };
  } catch (e) {
    return { success: false, message: messageFromError(e) };
  }
}