import fs from 'fs';
import path from 'path';
import db from './client.js';
import { logger } from '../utils/logger.js';

function safeExec(sql: string): void {
  try {
    db.exec(sql);
  } catch (err: unknown) {
    // Ignore if column or index already exists or table does not exist
  }
}

export function runMigrations(): void {
  logger.info('Applying database schema migrations...');

  // 1. First ensure base tables exist or columns are added
  safeExec("ALTER TABLE users ADD COLUMN age INTEGER CHECK(age IS NULL OR age >= 18);");
  safeExec("ALTER TABLE users ADD COLUMN province TEXT NOT NULL DEFAULT 'Batanes';");
  safeExec("ALTER TABLE users ADD COLUMN profile_picture_url TEXT;");
  safeExec("ALTER TABLE users ADD COLUMN avatar_url TEXT;");
  safeExec("ALTER TABLE users ADD COLUMN is_age_verified INTEGER NOT NULL DEFAULT 1 CHECK(is_age_verified IN (0, 1));");

  safeExec("ALTER TABLE tools ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;");
  safeExec("ALTER TABLE tools ADD COLUMN title TEXT;");
  safeExec("ALTER TABLE tools ADD COLUMN photo_url TEXT;");
  safeExec("ALTER TABLE tools ADD COLUMN daily_rate_centavos INTEGER NOT NULL DEFAULT 0;");
  safeExec("ALTER TABLE tools ADD COLUMN condition TEXT DEFAULT 'Good';");
  safeExec("ALTER TABLE tools ADD COLUMN discount_percentage INTEGER NOT NULL DEFAULT 0 CHECK(discount_percentage BETWEEN 0 AND 100);");

  safeExec("ALTER TABLE payments ADD COLUMN gateway_reference TEXT;");
  safeExec("ALTER TABLE payments ADD COLUMN paid_at TEXT;");

  // Search schema in common paths
  const schemaCandidates = [
    path.resolve(process.cwd(), 'db/schema.sql'),
    path.resolve(process.cwd(), '../../db/schema.sql'),
    path.resolve(import.meta.dirname, '../../../../db/schema.sql'),
  ];

  const schemaPath = schemaCandidates.find((p) => fs.existsSync(p));
  if (!schemaPath) {
    throw new Error('Could not find db/schema.sql');
  }

  const sql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(sql);

  logger.info('Database schema migration applied successfully.');
}

if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  try {
    runMigrations();
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Migration failed');
    process.exit(1);
  }
}
