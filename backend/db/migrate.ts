import fs from 'fs';
import path from 'path';
import db from './client.js';
import { logger } from '../src/utils/logger.js';

export function runMigrations(): void {
  logger.info('Applying database schema migrations...');

  const schemaCandidates = [
    path.resolve(import.meta.dirname, 'schema.sql'),
    path.resolve(process.cwd(), 'backend/db/schema.sql'),
    path.resolve(process.cwd(), 'db/schema.sql'),
    path.resolve(process.cwd(), '../db/schema.sql'),
  ];

  const schemaPath = schemaCandidates.find((p) => fs.existsSync(p));
  if (!schemaPath) {
    throw new Error('Could not find schema.sql');
  }

  const sql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(sql);

  // Also ensure sessions table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
      expires_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  `);

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
