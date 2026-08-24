import { z } from "zod";

export const registerSchema = z.object({
  nombre: z.string().min(2, "minimo 2 caracteres").max(100),
  email: z.email().max(255),
  password: z.string().min(8, "minimo 8 caracteres").max(72),
});

export const loginSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(1, "contrasena obligatoria").max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
