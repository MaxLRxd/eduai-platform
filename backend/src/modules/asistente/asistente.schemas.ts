import { z } from "zod";

export const contentIdsSchema = z.array(z.string().uuid("El material de referencia no es valido")).max(10);

const classDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha invalida (formato YYYY-MM-DD)")
  .optional();

export const generarMaterialSchema = z.object({
  materia_id: z.string().min(1),
  prompt: z.string().min(5).max(4000),
  class_date: classDateSchema,
  content_ids: contentIdsSchema.optional(),
});

export const crearSesionDocenteSchema = z.object({
  materia_id: z.string().min(1),
});

export const mensajeDocenteSchema = z.object({
  prompt: z.string().min(5).max(4000),
  class_date: classDateSchema,
  content_ids: contentIdsSchema.optional(),
});

export type GenerarMaterialInput = z.infer<typeof generarMaterialSchema>;
export type CrearSesionDocenteInput = z.infer<typeof crearSesionDocenteSchema>;
export type MensajeDocenteInput = z.infer<typeof mensajeDocenteSchema>;

export const materialPdfSchema = z.object({
  materia_id: z.string().min(1),
  material: z.string().min(1).max(60000),
  titulo: z.string().min(1).max(200).optional(),
});

export type MaterialPdfInput = z.infer<typeof materialPdfSchema>;
