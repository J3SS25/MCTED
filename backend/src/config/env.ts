import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env if present (check current cwd or project root)
const envFileCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(import.meta.dirname, '../../.env'),
  path.resolve(import.meta.dirname, '../../../.env'),
];

for (const envPath of envFileCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production', 'demo']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_PATH: z.string().default('./Database/app.db'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  SESSION_SECRET: z.string().min(16).default('mcteb-default-session-secret-batanes-32char'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  ALLOW_DEMO_SEED: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .default(false),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment configuration:', parsedEnv.error.format());
  process.exit(1);
}

function resolveDbPath(configuredPath: string): string {
  // If explicitly configured and exists, resolve it
  const directPath = path.resolve(process.cwd(), configuredPath);
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  // Look in standard root Database folder
  const candidates = [
    directPath,
    path.resolve(process.cwd(), 'Database/app.db'),
    path.resolve(process.cwd(), '../Database/app.db'),
    path.resolve(import.meta.dirname, '../../../Database/app.db'),
    path.resolve(import.meta.dirname, '../../Database/app.db'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Fallback to direct path or ../Database/app.db
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
}

export const env = {
  ...parsedEnv.data,
  DATABASE_PATH_RESOLVED: resolveDbPath(parsedEnv.data.DATABASE_PATH),
};
