import { z } from "zod";

export const modoSesionSchema = z.enum(["NORMAL", "SOCRATIC", "HINTS"]);

export const crearSesionSchema = z.object({
  modo: modoSesionSchema.default("NORMAL"),
});

export const enviarMensajeSchema = z.object({
  contenido: z.string().min(1, "El mensaje no puede estar vacio").max(8000),
});

export type CrearSesionInput = z.infer<typeof crearSesionSchema>;
export type EnviarMensajeInput = z.infer<typeof enviarMensajeSchema>;
