import type { LicensePlan } from "../types/domain";
import { api } from "./api";

interface EstadoLicenciaApi {
  uso: { current: number; limit: number };
  planes: LicensePlan[];
}

let cache: Promise<EstadoLicenciaApi> | null = null;

function getEstadoLicencia(): Promise<EstadoLicenciaApi> {
  if (!cache) {
    cache = api<EstadoLicenciaApi>("/api/admin/license").catch((error) => {
      cache = null;
      throw error;
    });
  }
  return cache;
}

export async function getLicenseUsage(): Promise<{ current: number; limit: number }> {
  const data = await getEstadoLicencia();
  return data.uso;
}

export async function getLicensePlans(): Promise<LicensePlan[]> {
  const data = await getEstadoLicencia();
  return data.planes;
}