import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional(),
  CHROMA_URL: z.string().optional(),
  AI_SERVICE_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  JWT_SECRET: z.string().min(16),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  REFRESH_TTL_DAYS: z.coerce.number().default(7),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Missing or invalid env vars:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;