import { z } from "zod";

export const estadosAsistencia = ["PRESENTE", "AUSENTE", "TARDANZA", "JUSTIFICADO"] as const;

export const registraAsistenciaSchema = z.object({
  fecha_clase: z.coerce.date(),
  registros: z
    .array(
      z.object({
        alumno_id: z.string().uuid("id de alumno invalido"),
        estado: z.enum(estadosAsistencia),
      })
    )
    .min(1, "registra al menos un alumno")
    .max(200, "demasiados registros en una llamada"),
});

export const actualizarAsistenciaSchema = z.object({
  estado: z.enum(estadosAsistencia),
});

export type RegistraAsistenciaInput = z.infer<typeof registraAsistenciaSchema>;
export type ActualizarAsistenciaInput = z.infer<typeof actualizarAsistenciaSchema>;