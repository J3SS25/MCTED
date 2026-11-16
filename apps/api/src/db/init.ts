import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import db from './client.js';
import { logger } from '../utils/logger.js';

export function initDatabase(): void {
  logger.info('Initializing MCTEB SQLite development database...');

  const dbDir = path.dirname(env.DATABASE_PATH_RESOLVED);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    logger.info(`Created database directory: ${dbDir}`);
  }

  // Verify connectivity and SQLite engine
  const result = db.prepare<{ ok: number }>('SELECT 1 as ok').get();
  if (result?.ok !== 1) {
    throw new Error('Database sanity check failed');
  }

  // Count existing tables
  const tables = db
    .prepare<{
      count: number;
    }>(
      "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )
    .get();

  const tableCount = tables?.count ?? 0;
  logger.info(`Database file verified at: ${env.DATABASE_PATH_RESOLVED}`);
  logger.info(`Current schema contains ${tableCount} user tables.`);

  if (tableCount === 0) {
    logger.info('Database is empty. Run `pnpm run db:migrate` to apply the initial schema.');
  } else {
    logger.info('Database is initialized and ready.');
  }
}

if (process.argv[1]?.endsWith('init.ts') || process.argv[1]?.endsWith('init.js')) {
  try {
    initDatabase();
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Database initialization failed');
    process.exit(1);
  }
}
