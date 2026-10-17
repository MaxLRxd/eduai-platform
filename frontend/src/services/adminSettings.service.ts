import { api } from "./api";
import { toBranding } from "./config.service";
import type { BrandingApi } from "./config.service";
import type { ColorPreset, InstitutionBranding } from "../types/domain";

export type { InstitutionBranding } from "../types/domain";

// GET /api/admin/branding/presets — esquemas de color preconfigurados.
export async function getColorPresets(): Promise<ColorPreset[]> {
  const data = await api<{ presets: ColorPreset[] }>("/api/admin/branding/presets");
  return data.presets;
}

// GET /api/admin/branding — identidad de la institución.
export async function getBranding(): Promise<InstitutionBranding> {
  const data = await api<{ branding: BrandingApi }>("/api/admin/branding");
  return toBranding(data.branding);
}

// POST /api/admin/branding/logo — sube el logo al storage y devuelve su URL.
export async function uploadBrandingLogo(file: File): Promise<string> {
  const form = new FormData();
  form.append("logo", file);
  const data = await api<{ logo_url: string }>("/api/admin/branding/logo", {
    method: "POST",
    body: form,
  });
  return data.logo_url;
}

export interface SaveBrandingInput {
  nombre: string;
  colorPrimario: string;
  colorSecundario: string;
  colorClaro: string;
  logoUrl?: string | null;
}

// PUT /api/admin/branding { nombre, color_primario, color_secundario, color_claro, logo_url }.
export async function saveBranding(input: SaveBrandingInput): Promise<InstitutionBranding> {
  const data = await api<{ branding: BrandingApi }>("/api/admin/branding", {
    method: "PUT",
    body: JSON.stringify({
      nombre: input.nombre,
      color_primario: input.colorPrimario,
      color_secundario: input.colorSecundario,
      color_claro: input.colorClaro,
      logo_url: input.logoUrl,
    }),
  });
  return toBranding(data.branding);
}
