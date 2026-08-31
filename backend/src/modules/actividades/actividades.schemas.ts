import { z } from "zod";

export const tipoActividadSchema = z.enum(["MULTIPLE_CHOICE", "DESARROLLO", "ARCHIVO", "CODIGO"]);

export const opcionMcSchema = z.object({
  texto: z.string().min(1),
  correcta: z.boolean(),
});

export const crearActividadSchema = z.object({
  seccion_id: z.string().uuid(),
  rubrica_id: z.string().uuid().optional(),
  nombre: z.string().min(1).max(200),
  consigna: z.string().min(1),
  tipo: tipoActividadSchema,
  opciones_mc: z.array(opcionMcSchema).optional(),
  formatos_permitidos: z.string().max(100).nullish(),
  fecha_limite: z.coerce.date(),
  correccion_manual: z.boolean().default(false),
});

export const actualizarActividadSchema = crearActividadSchema.partial();

export const enviarEntregaSchema = z
  .object({
    respuesta_texto: z.string().min(1).optional(),
    respuesta_codigo: z.string().min(1).optional(),
    archivo_url: z.string().min(1).optional(),
    archivo_nombre: z.string().max(255).optional(),
  })
  .refine((d) => d.respuesta_texto || d.respuesta_codigo || d.archivo_url, {
    message: "La entrega debe incluir una respuesta en texto/codigo o un archivo",
  });

export const corregirEntregaSchema = z.object({
  calificacion_final: z.number().min(0).max(10, "La calificacion debe estar entre 0 y 10"),
  feedback_final: z.string().min(1),
  revision_tipo: z.enum(["IA", "MANUAL"]).optional(),
});

export const crearRubricaSchema = z.object({
  nombre: z.string().min(1).max(200),
  descripcion: z.string().optional(),
  criterios: z
    .array(
      z.object({
        nombre: z.string().min(1),
        peso: z.number().min(0).max(100),
      })
    )
    .min(1, "La rubrica debe tener al menos un criterio"),
});

export type CrearActividadInput = z.infer<typeof crearActividadSchema>;
export type ActualizarActividadInput = z.infer<typeof actualizarActividadSchema>;
export type EnviarEntregaInput = z.infer<typeof enviarEntregaSchema>;
export type CorregirEntregaInput = z.infer<typeof corregirEntregaSchema>;
export type CrearRubricaInput = z.infer<typeof crearRubricaSchema>;