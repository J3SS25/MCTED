import fs from 'fs';
import path from 'path';
import db from './client.js';
import { logger } from '../utils/logger.js';

export function runMigrations(): void {
  logger.info('Applying database schema migrations...');

  // Search schema in common paths
  const schemaCandidates = [
    path.resolve(process.cwd(), 'db/schema.sql'),
    path.resolve(process.cwd(), '../../db/schema.sql'),
    path.resolve(import.meta.dirname, '../../../../db/schema.sql'),
  ];

  let schemaPath = schemaCandidates.find((p) => fs.existsSync(p));
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

