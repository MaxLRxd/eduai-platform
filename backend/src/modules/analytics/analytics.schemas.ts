import { z } from "zod";

export const crearPreguntaFrecuenteSchema = z.object({
  pregunta: z.string().min(1, "La pregunta es obligatoria"),
  respuesta: z.string().min(1, "La respuesta es obligatoria"),
});

export const actualizarPreguntaFrecuenteSchema = crearPreguntaFrecuenteSchema.partial();

export const tipoErrorDudaSchema = z.enum(["ERROR", "DUDA"]);
export const nivelSeveridadSchema = z.enum(["BAJA", "MEDIA", "ALTA"]);
export const tipoAlertaSchema = z.enum(["ASISTENCIA", "NOTAS", "INTERACCIONES"]);

export type CrearPreguntaFrecuenteInput = z.infer<typeof crearPreguntaFrecuenteSchema>;
export type ActualizarPreguntaFrecuenteInput = z.infer<typeof actualizarPreguntaFrecuenteSchema>;
