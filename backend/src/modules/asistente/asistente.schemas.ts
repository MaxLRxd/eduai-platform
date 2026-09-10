import { z } from "zod";

export const generarMaterialSchema = z.object({
  materia_id: z.string().min(1),
  prompt: z.string().min(5).max(4000),
  class_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha invalida (formato YYYY-MM-DD)")
    .optional(),
});

export type GenerarMaterialInput = z.infer<typeof generarMaterialSchema>;