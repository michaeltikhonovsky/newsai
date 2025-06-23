import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().url(),
  EXTERNAL_API_URL: z.string().url().optional(),
  EXTERNAL_API_AUTH_KEY: z.string().optional(),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  EXTERNAL_API_URL: process.env.EXTERNAL_API_URL,
  EXTERNAL_API_AUTH_KEY: process.env.EXTERNAL_API_AUTH_KEY,
});
