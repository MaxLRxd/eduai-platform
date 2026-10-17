import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional(),
  AI_SERVICE_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  EMAIL_PROVIDER: z.enum(['none', 'resend', 'brevo', 'smtp']).default('none'),
  EMAIL_FROM: z.string().optional(),
  EMAIL_API_KEY: z.string().optional(),
  EMAIL_SMTP_HOST: z.string().optional(),
  EMAIL_SMTP_PORT: z.coerce.number().optional(),
  EMAIL_SMTP_USER: z.string().optional(),
  EMAIL_SMTP_PASS: z.string().optional(),
  UPLOAD_DIR: z.string().default("data/uploads"),
  MAX_FILE_SIZE_MB: z.coerce.number().default(50),
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