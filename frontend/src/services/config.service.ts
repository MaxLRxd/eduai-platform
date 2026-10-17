import { api } from "./api";
import type { InstitutionBranding } from "../types/domain";

// Respuesta cruda del backend (snake_case).
export interface BrandingApi {
  nombre: string;
  logo_url: string | null;
  color_primario: string | null;
  color_secundario: string | null;
  color_claro: string | null;
}

export function toBranding(b: BrandingApi): InstitutionBranding {
  return {
    nombre: b.nombre,
    logoUrl: b.logo_url,
    colorPrimario: b.color_primario,
    colorSecundario: b.color_secundario,
    colorClaro: b.color_claro,
  };
}

// GET /api/config/branding — publico: el shell lo usa para el nombre, logo y colores.
export async function getConfigBranding(): Promise<InstitutionBranding> {
  const data = await api<{ branding: BrandingApi }>("/api/config/branding");
  return toBranding(data.branding);
}
