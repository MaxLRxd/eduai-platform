import { z } from "zod";

export const crearNotaSchema = z.object({
  alumno_id: z.string().uuid("id de alumno invalido"),
  periodo: z.string().min(1, "periodo obligatorio").max(100),
  calificacion: z.coerce.number().min(0, "minimo 0").max(10, "maximo 10"),
  observaciones: z.string().max(1000).optional(),
});

export const actualizarNotaSchema = z.object({
  calificacion: z.coerce.number().min(0, "minimo 0").max(10, "maximo 10"),
  observaciones: z.string().max(1000).optional(),
});

export type CrearNotaInput = z.infer<typeof crearNotaSchema>;
export type ActualizarNotaInput = z.infer<typeof actualizarNotaSchema>;