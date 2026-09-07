import { api } from "./api";
import type { ColorPreset } from "../types/domain";
import { MOCK_COLOR_PRESETS } from "../data/mock/adminSettings.mock";

export interface InstitutionBranding {
  nombre: string;
  logoUrl: string | null;
  colorPrimario: string | null;
  colorSecundario: string | null;
}

interface BrandingApi {
  nombre: string;
  logo_url: string | null;
  color_primario: string | null;
  color_secundario: string | null;
}

function toBranding(b: BrandingApi): InstitutionBranding {
  return {
    nombre: b.nombre,
    logoUrl: b.logo_url,
    colorPrimario: b.color_primario,
    colorSecundario: b.color_secundario,
  };
}

// Presets de color: lista estática de la UI (no vive en backend).
export async function getColorPresets(): Promise<ColorPreset[]> {
  return Promise.resolve(MOCK_COLOR_PRESETS);
}

// GET /api/admin/branding — identidad de la institución.
export async function getBranding(): Promise<InstitutionBranding> {
  const data = await api<{ branding: BrandingApi }>("/api/admin/branding");
  return toBranding(data.branding);
}

export interface SaveBrandingInput {
  nombre: string;
  colorPrimario: string;
  colorSecundario: string;
  logoUrl?: string | null;
}

// PUT /api/admin/branding { nombre, color_primario, color_secundario, logo_url }.
export async function saveBranding(input: SaveBrandingInput): Promise<InstitutionBranding> {
  const data = await api<{ branding: BrandingApi }>("/api/admin/branding", {
    method: "PUT",
    body: JSON.stringify({
      nombre: input.nombre,
      color_primario: input.colorPrimario,
      color_secundario: input.colorSecundario,
      logo_url: input.logoUrl,
    }),
  });
  return toBranding(data.branding);
}