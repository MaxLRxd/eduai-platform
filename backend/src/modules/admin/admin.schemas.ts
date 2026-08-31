import { z } from "zod";

export const rolSchema = z.enum(["ALUMNO", "PROFESOR", "ADMIN"]);
export const tipoProfesorSchema = z.enum(["TITULAR", "ADJUNTO"]);

export const crearUsuarioSchema = z.object({
  nombre: z.string().min(2).max(100),
  email: z.string().email("email invalido").max(255),
  password: z.string().min(6, "minimo 6 caracteres").max(100),
  rol: rolSchema.default("ALUMNO"),
  tipo_profesor: tipoProfesorSchema.optional(),
});

export const actualizarEstadoSchema = z.object({
  activo: z.boolean(),
});

export const cambiarRolSchema = z.object({
  rol: rolSchema,
  tipo_profesor: tipoProfesorSchema.optional(),
});

export const crearMateriaAdminSchema = z.object({
  nombre: z.string().min(2).max(150),
  descripcion: z.string().max(2000).optional(),
  nivel_educativo: z.string().min(1).max(100),
});

export const actualizarMateriaAdminSchema = z.object({
  nombre: z.string().min(2).max(150).optional(),
  descripcion: z.string().max(2000).nullish(),
  nivel_educativo: z.string().min(1).max(100).optional(),
  activa: z.boolean().optional(),
});

export const asignarProfesorSchema = z.object({
  profesor_id: z.string().uuid("id de profesor invalido"),
  activo: z.boolean().default(true),
});

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
export type ActualizarEstadoInput = z.infer<typeof actualizarEstadoSchema>;
export type CambiarRolInput = z.infer<typeof cambiarRolSchema>;
export type CrearMateriaAdminInput = z.infer<typeof crearMateriaAdminSchema>;
export type ActualizarMateriaAdminInput = z.infer<typeof actualizarMateriaAdminSchema>;
export type AsignarProfesorInput = z.infer<typeof asignarProfesorSchema>;
