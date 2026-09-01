import { z } from "zod";

export const estadoPlanningSchema = z.enum(["PLANIFICADO", "PUBLICADO"]);

export const upsertPlanningSchema = z.object({
  titulo: z.string().min(2).max(200),
  contenido: z.string().max(10000).optional(),
  estado: estadoPlanningSchema.optional(),
});

export type UpsertPlanningInput = z.infer<typeof upsertPlanningSchema>;
