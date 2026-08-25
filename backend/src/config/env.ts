import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional(),
  CHROMA_URL: z.string().optional(),
  AI_SERVICE_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  JWT_SECRET: z.string().min(16).optional(),
  PORT: z.coerce.number().default(3000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Missing or invalid env vars:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;