import { z } from "zod";
import { rolSchema } from "../admin/admin.schemas";

export const enviarMensajeSchema = z.object({
  destinatario_id: z.string().uuid("id de destinatario invalido"),
  contenido: z.string().min(1).max(5000),
});

export const broadcastSchema = z.object({
  titulo: z.string().min(1).max(200),
  contenido: z.string().min(1).max(5000),
  dirigido_a: rolSchema.optional(),
});

export type EnviarMensajeInput = z.infer<typeof enviarMensajeSchema>;
export type BroadcastInput = z.infer<typeof broadcastSchema>;
