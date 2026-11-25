import type { Licencia } from "../types/domain";
import { api } from "./api";

// GET /api/admin/license — la licencia unica de la institucion y su uso informativo (sin topes ni planes).
export async function getLicencia(): Promise<Licencia> {
  return api<Licencia>("/api/admin/license");
}
