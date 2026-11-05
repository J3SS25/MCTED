import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables from .env if present
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production', 'demo']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_PATH: z.string().default('./data/app.db'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  SESSION_SECRET: z.string().min(16).default('mcteb-default-session-secret-batanes-32char'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  ALLOW_DEMO_SEED: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment configuration:', parsedEnv.error.format());
  process.exit(1);
}

export const env = {
  ...parsedEnv.data,
  DATABASE_PATH_RESOLVED: path.resolve(process.cwd(), parsedEnv.data.DATABASE_PATH),
};

