import { z } from "zod";

const calificacion = z.coerce.number().min(0, "minimo 0").max(10, "maximo 10");

export const crearNotaSchema = z.object({
  alumno_id: z.string().uuid("id de alumno invalido"),
  periodo: z.string().trim().min(1, "periodo obligatorio").max(100),
  evaluacion: z.string().trim().max(200).optional(),
  categoria_id: z.string().uuid("categoria invalida").nullable().optional(),
  calificacion,
  observaciones: z.string().max(1000).optional(),
});

export const actualizarNotaSchema = z.object({
  calificacion,
  observaciones: z.string().max(1000).optional(),
  evaluacion: z.string().trim().max(200).optional(),
  categoria_id: z.string().uuid("categoria invalida").nullable().optional(),
});

export const categoriasNotaSchema = z
  .object({
    categorias: z
      .array(
        z.object({
          id: z.string().uuid().optional(),
          nombre: z.string().trim().min(1, "El nombre de la categoria es obligatorio").max(80),
          peso: z.coerce.number().gt(0, "El peso debe ser mayor a 0").max(100, "El peso no puede superar 100"),
        })
      )
      .max(20, "Maximo 20 categorias"),
  })
  .superRefine((valor, ctx) => {
    if (valor.categorias.length === 0) return; // sin categorias = promedio simple
    const suma = valor.categorias.reduce((s, c) => s + c.peso, 0);
    if (Math.abs(suma - 100) > 0.01) {
      ctx.addIssue({ code: "custom", message: `Los pesos deben sumar 100 (suman ${Math.round(suma * 100) / 100})`, path: ["categorias"] });
    }
    const nombres = valor.categorias.map((c) => c.nombre.toLowerCase());
    if (new Set(nombres).size !== nombres.length) {
      ctx.addIssue({ code: "custom", message: "Hay categorias con el mismo nombre", path: ["categorias"] });
    }
  });

export const sincronizarActividadSchema = z.object({
  periodo: z.string().trim().min(1, "periodo obligatorio").max(100),
  categoria_id: z.string().uuid("categoria invalida").nullable().optional(),
});

export type CrearNotaInput = z.infer<typeof crearNotaSchema>;
export type ActualizarNotaInput = z.infer<typeof actualizarNotaSchema>;
export type CategoriasNotaInput = z.infer<typeof categoriasNotaSchema>;
export type SincronizarActividadInput = z.infer<typeof sincronizarActividadSchema>;
