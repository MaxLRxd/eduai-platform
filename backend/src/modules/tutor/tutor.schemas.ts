import { z } from "zod";

export const modoSesionSchema = z.enum(["NORMAL", "SOCRATIC", "HINTS"]);

export const crearSesionSchema = z.object({
  modo: modoSesionSchema.default("NORMAL"),
});

export const enviarMensajeSchema = z.object({
  contenido: z.string().min(1, "El mensaje no puede estar vacio").max(8000),
  modo: modoSesionSchema.optional(),
});

const uuidSchema = z.string().uuid("El id debe ser un UUID valido");

export const resumenSchema = z
  .object({
    contenido_id: uuidSchema.optional(),
    texto: z.string().min(200, "El texto debe tener al menos 200 caracteres").max(60000).optional(),
    idioma: z.string().min(2).max(8).default("es"),
    max_palabras: z.number().int().min(30).max(1000).default(150),
  })
  .refine((v) => Boolean(v.contenido_id) !== Boolean(v.texto), {
    message: "Envia exactamente uno: contenido_id o texto",
  });

export const examenSchema = z.object({
  n_preguntas: z.number().int().min(1).max(20).default(5),
  dificultad: z.enum(["facil", "media", "dificil"]).default("media"),
});

export type CrearSesionInput = z.infer<typeof crearSesionSchema>;
export type EnviarMensajeInput = z.infer<typeof enviarMensajeSchema>;
export type ResumenInput = z.infer<typeof resumenSchema>;
export type ExamenInput = z.infer<typeof examenSchema>;
