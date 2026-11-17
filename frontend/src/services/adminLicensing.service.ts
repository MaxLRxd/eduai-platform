import type { LicensePlan } from "../types/domain";
import { api } from "./api";

interface EstadoLicenciaApi {
  uso: { current: number; limit: number };
  planes: LicensePlan[];
}

// Solo junta los dos pedidos simultáneos (uso y planes) en uno; no guarda el resultado, así que
// nunca devuelve datos viejos ni de otro usuario.
let enCurso: Promise<EstadoLicenciaApi> | null = null;

function getEstadoLicencia(): Promise<EstadoLicenciaApi> {
  if (!enCurso) {
    enCurso = api<EstadoLicenciaApi>("/api/admin/license").finally(() => {
      enCurso = null;
    });
  }
  return enCurso;
}

export function reiniciarCacheDeLicencias(): void {
  enCurso = null;
}

export async function getLicenseUsage(): Promise<{ current: number; limit: number }> {
  const data = await getEstadoLicencia();
  return data.uso;
}

export async function getLicensePlans(): Promise<LicensePlan[]> {
  const data = await getEstadoLicencia();
  return data.planes;
}