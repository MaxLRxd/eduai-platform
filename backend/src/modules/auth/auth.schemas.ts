import { z } from "zod";

export const registerSchema = z.object({
  nombre: z.string().min(2, "minimo 2 caracteres").max(100),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8, "minimo 8 caracteres").max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(1, "contrasena obligatoria").max(72),
});

export const cambiarPasswordSchema = z
  .object({
    password_actual: z.string().min(1, "contrasena actual obligatoria").max(72),
    password_nueva: z.string().min(8, "minimo 8 caracteres").max(72),
  })
  .refine((d) => d.password_actual !== d.password_nueva, {
    message: "la nueva contrasena debe ser distinta de la actual",
    path: ["password_nueva"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CambiarPasswordInput = z.infer<typeof cambiarPasswordSchema>;
