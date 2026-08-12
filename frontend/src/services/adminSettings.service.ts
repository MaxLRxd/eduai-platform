import type { ColorPreset } from "../types/domain";
import { DEFAULT_INSTITUTION_NAME, MOCK_COLOR_PRESETS } from "../data/mock/adminSettings.mock";

// TODO(backend): GET /api/admin/branding — no hay modelo de Institution/Branding en schema.prisma todavía.
export async function getColorPresets(): Promise<ColorPreset[]> {
  return Promise.resolve(MOCK_COLOR_PRESETS);
}

export async function getInstitutionName(): Promise<string> {
  return Promise.resolve(DEFAULT_INSTITUTION_NAME);
}

// TODO(backend): PUT /api/admin/branding { name, logoUrl, colors }.
export async function saveBranding(): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { success: true };
}
