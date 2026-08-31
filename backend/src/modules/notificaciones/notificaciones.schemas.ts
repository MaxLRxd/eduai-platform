import { z } from "zod";

const tipoNotificacionSchema = z.enum(["ENTREGA", "FEEDBACK", "ALERTA", "MENSAJE"]);

export const crearNotificacionSchema = z.object({
  usuario_id: z.string().uuid("id de usuario invalido"),
  tipo: tipoNotificacionSchema,
  titulo: z.string().min(1).max(200),
  mensaje: z.string().min(1),
  referencia_tipo: z.string().max(50).optional(),
  referencia_id: z.string().uuid().optional(),
});

export type CrearNotificacionInput = z.infer<typeof crearNotificacionSchema>;
