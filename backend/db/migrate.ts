import fs from 'fs';
import path from 'path';
import db from './client.js';
import { logger } from '../src/utils/logger.js';

function getTableColumns(tableName: string): Set<string> {
  const rows = db.prepare<{ name: string }>(`PRAGMA table_info(${tableName})`).all();
  return new Set(rows.map((r) => r.name));
}

function upgradeExistingSchema(): void {
  // 1. Upgrade users table columns
  const userCols = getTableColumns('users');
  if (!userCols.has('province')) {
    db.exec("ALTER TABLE users ADD COLUMN province TEXT NOT NULL DEFAULT 'Batanes';");
  }
  if (!userCols.has('age')) {
    db.exec('ALTER TABLE users ADD COLUMN age INTEGER;');
  }
  if (!userCols.has('avatar_url')) {
    db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT;');
  }

  // Backfill age from birth_date where missing
  db.exec(`
    UPDATE users
    SET age = CAST((julianday('now') - julianday(birth_date)) / 365.2425 AS INTEGER)
    WHERE age IS NULL AND birth_date IS NOT NULL;
  `);

  // 2. Upgrade tools table columns & normalize legacy categories
  const toolCols = getTableColumns('tools');
  if (!toolCols.has('owner_id')) {
    db.exec('ALTER TABLE tools ADD COLUMN owner_id TEXT REFERENCES users(id) ON DELETE SET NULL;');
  }
  if (!toolCols.has('images_json')) {
    db.exec('ALTER TABLE tools ADD COLUMN images_json TEXT;');
  }
  db.exec("UPDATE tools SET category = 'Agriculture' WHERE category = 'Agricultural';");
  db.exec("UPDATE tools SET category = 'Fishing' WHERE category = 'Fishery';");

  // 3. Remove legacy fee, deposit, discount, penalty, cost, and payment artifacts if present
  db.exec('DROP INDEX IF EXISTS idx_payments_user;');
  db.exec('DROP INDEX IF EXISTS idx_payments_status;');
  db.exec('DROP TABLE IF EXISTS payments;');

  const dropColumns = (tableName: string, colsToRemove: string[]) => {
    const existingCols = getTableColumns(tableName);
    for (const col of colsToRemove) {
      if (existingCols.has(col)) {
        db.exec(`ALTER TABLE ${tableName} DROP COLUMN ${col};`);
      }
    }
  };

  db.pragma('foreign_keys = OFF');
  try {
    dropColumns('tools', ['rental_fee_centavos', 'deposit_fee_centavos', 'discount_percent']);
    dropColumns('rentals', ['overdue_penalty_centavos', 'damage_penalty_centavos']);
    dropColumns('maintenance', ['estimated_cost_centavos', 'actual_cost_centavos']);
  } finally {
    db.pragma('foreign_keys = ON');
  }

  db.exec("DELETE FROM notifications WHERE link_url LIKE '%payment%';");
  db.exec(
    "DELETE FROM audit_logs WHERE target_type = 'payment' OR action LIKE 'PAYMENT_%' OR action = 'RENTAL_CHECKOUT';",
  );
}

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

  // Upgrade existing schema columns & constraints
  upgradeExistingSchema();

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
