import { z } from "zod";

const colorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, "color invalido (formato HEX)");

export const brandingSchema = z.object({
  nombre: z.string().min(2).max(200).optional(),
  logo_url: z.string().max(500).nullish(),
  color_primario: colorSchema.optional(),
  color_secundario: colorSchema.optional(),
});

export type BrandingInput = z.infer<typeof brandingSchema>;

export const PRESETS_COLOR: { nombre: string; primario: string; secundario: string }[] = [
  { nombre: "azul", primario: "#2563eb", secundario: "#1e40af" },
  { nombre: "verde", primario: "#059669", secundario: "#047857" },
  { nombre: "violeta", primario: "#7c3aed", secundario: "#6d28d9" },
  { nombre: "naranja", primario: "#ea580c", secundario: "#c2410c" },
  { nombre: "negro", primario: "#111827", secundario: "#374151" },
];
