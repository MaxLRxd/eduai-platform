import { z } from "zod";

const colorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, "color invalido (formato HEX)");

export const brandingSchema = z.object({
  nombre: z.string().min(2).max(200).optional(),
  logo_url: z.string().max(5_000_000).nullish(),
  color_primario: colorSchema.optional(),
  color_secundario: colorSchema.optional(),
  color_claro: colorSchema.optional(),
});

export type BrandingInput = z.infer<typeof brandingSchema>;

export interface ColorPreset {
  id: string;
  name: string;
  inst: string;
  primary: string;
  secondary: string;
  lighter: string;
}

// Fuente de verdad de los esquemas de color preconfigurados (la UI admin los consume).
export const COLOR_PRESETS: ColorPreset[] = [
  { id: "p-blue", name: "Azul institucional", inst: "Clásico SIU", primary: "#003d7a", secondary: "#005fa3", lighter: "#dbeafe" },
  { id: "p-green", name: "Verde académico", inst: "Cs. Naturales", primary: "#065f46", secondary: "#047857", lighter: "#d1fae5" },
  { id: "p-red", name: "Bordo universitario", inst: "Humanidades", primary: "#7c0d0d", secondary: "#991b1b", lighter: "#fee2e2" },
  { id: "p-purple", name: "Violeta moderno", inst: "Tecnología", primary: "#5b21b6", secondary: "#6d28d9", lighter: "#ede9fe" },
  { id: "p-orange", name: "Naranja energético", inst: "Arte y Diseño", primary: "#c2410c", secondary: "#ea580c", lighter: "#ffedd5" },
  { id: "p-gray", name: "Gris corporativo", inst: "Administración", primary: "#374151", secondary: "#4b5563", lighter: "#f3f4f6" },
  { id: "p-indigo", name: "Índigo profundo", inst: "Ingeniería", primary: "#1e3a8a", secondary: "#1d4ed8", lighter: "#eff6ff" },
  { id: "p-teal", name: "Teal salud", inst: "Enfermería", primary: "#0f766e", secondary: "#0d9488", lighter: "#ccfbf1" },
];
