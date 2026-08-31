import { z } from "zod";

export const tipoContenidoSchema = z.enum(["TEXTO", "PDF", "DOCX", "PPTX", "IMAGEN", "VIDEO"]);

export const crearContenidoSchema = z.object({
  tipo: tipoContenidoSchema,
  titulo: z.string().min(1, "El titulo es obligatorio").max(200),
  texto_contenido: z.string().max(100_000).optional(),
  archivo_url: z.string().max(1000).optional(),
  archivo_nombre: z.string().max(255).optional(),
  archivo_formato: z.string().max(20).optional(),
  archivo_tamano_kb: z.number().int().nonnegative().optional(),
});

export const actualizarContenidoSchema = crearContenidoSchema.partial();

export type CrearContenidoInput = z.infer<typeof crearContenidoSchema>;
export type ActualizarContenidoInput = z.infer<typeof actualizarContenidoSchema>;
