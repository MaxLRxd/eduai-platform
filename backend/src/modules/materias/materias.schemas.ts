import { z } from "zod";

export const createMateriaSchema = z.object({
  nombre: z.string().min(2, "minimo 2 caracteres").max(150),
  descripcion: z.string().max(2000).optional(),
  nivel_educativo: z.string().min(1, "nivel educativo obligatorio").max(100),
});

export const crearClaveSchema = z.object({
  max_usos: z.number().int().positive().max(10000).optional(),
  vencimiento: z.coerce.date().optional(),
});

export const unirseSchema = z.object({
  clave: z.string().min(4, "clave invalida").max(50),
});

export type CreateMateriaInput = z.infer<typeof createMateriaSchema>;
export type CrearClaveInput = z.infer<typeof crearClaveSchema>;
export type UnirseInput = z.infer<typeof unirseSchema>;
