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

const preguntaCorregirSchema = z.object({
  tipo: z.enum(["multiple_choice", "desarrollo"]),
  enunciado: z.string().min(1).max(4000),
  opciones: z.array(z.string().max(1000)).max(8).default([]),
  respuesta_modelo: z.string().max(8000).default(""),
  respuesta_alumno: z.string().max(8000).default(""),
});

export const corregirExamenSchema = z.object({
  titulo: z.string().min(1).max(200),
  dificultad: z.enum(["facil", "media", "dificil"]).default("media"),
  preguntas: z.array(preguntaCorregirSchema).min(1).max(20),
  // false = corregir sin guardar el intento en el historial (CU-A11, paso de confirmacion).
  registrar: z.boolean().default(true),
});

export const resumenPdfSchema = z.object({
  titulo: z.string().trim().min(1).max(200).default("Resumen"),
  resumen: z.string().min(1).max(30000),
});

export type CrearSesionInput = z.infer<typeof crearSesionSchema>;
export type EnviarMensajeInput = z.infer<typeof enviarMensajeSchema>;
export type ResumenInput = z.infer<typeof resumenSchema>;
export type ExamenInput = z.infer<typeof examenSchema>;
export type ResumenPdfInput = z.infer<typeof resumenPdfSchema>;
export type CorregirExamenInput = z.infer<typeof corregirExamenSchema>;
