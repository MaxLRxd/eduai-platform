import { z } from "zod";

export const tipoSeccionSchema = z.enum(["TEORIA", "PRACTICA"]);

export const crearSeccionSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(150),
  descripcion: z.string().max(2000).optional(),
  tipo: tipoSeccionSchema,
  orden: z.number().int().min(0).default(0),
});

export const actualizarSeccionSchema = crearSeccionSchema.partial();

export type CrearSeccionInput = z.infer<typeof crearSeccionSchema>;
export type ActualizarSeccionInput = z.infer<typeof actualizarSeccionSchema>;
