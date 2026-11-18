import { z } from "zod";

export const tipoSeccionSchema = z.enum(["TEORIA", "PRACTICA"]);

export const crearSeccionSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(150),
  descripcion: z.string().max(2000).optional(),
  tipo: tipoSeccionSchema,
  orden: z.number().int().min(0).default(0),
});

export const actualizarSeccionSchema = crearSeccionSchema.partial();

export const reordenarSeccionesSchema = z
  .object({
    ids: z.array(z.string().uuid("id de seccion invalido")).min(1, "Falta la lista de secciones"),
  })
  .refine((v) => new Set(v.ids).size === v.ids.length, { message: "Hay secciones repetidas", path: ["ids"] });

export type ReordenarSeccionesInput = z.infer<typeof reordenarSeccionesSchema>;
export type CrearSeccionInput = z.infer<typeof crearSeccionSchema>;
export type ActualizarSeccionInput = z.infer<typeof actualizarSeccionSchema>;
