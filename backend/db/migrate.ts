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
  if (!toolCols.has('discount_percent')) {
    db.exec('ALTER TABLE tools ADD COLUMN discount_percent INTEGER NOT NULL DEFAULT 0;');
  }
  db.exec("UPDATE tools SET category = 'Agriculture' WHERE category = 'Agricultural';");
  db.exec("UPDATE tools SET category = 'Fishing' WHERE category = 'Fishery';");

  // 3. Upgrade payments table if CHECK constraint or columns are outdated
  const paymentsMeta = db
    .prepare<{
      sql: string;
    }>("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'payments'")
    .get();
  const paymentCols = getTableColumns('payments');
  const needsPaymentsRebuild =
    !paymentsMeta?.sql?.includes('LANDBANK') || !paymentCols.has('items_json');

  if (needsPaymentsRebuild) {
    logger.info(
      'Rebuilding payments table to apply updated payment methods and receipt columns...',
    );
    db.pragma('foreign_keys = OFF');
    try {
      db.transaction(() => {
        db.exec(`
          CREATE TABLE payments_new (
            id TEXT PRIMARY KEY,
            receipt_reference TEXT NOT NULL UNIQUE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            reservation_id TEXT REFERENCES reservations(id) ON DELETE SET NULL,
            rental_id TEXT REFERENCES rentals(id) ON DELETE SET NULL,
            tool_id TEXT REFERENCES tools(id) ON DELETE SET NULL,
            amount_centavos INTEGER NOT NULL,
            payment_method TEXT NOT NULL CHECK(payment_method IN ('GCash', 'LANDBANK', 'Maya (PayMaya)', 'BDO', 'Cash', 'Bank Transfer', 'Municipal Treasury')),
            status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Paid', 'Failed', 'Refunded')),
            proof_url TEXT,
            items_json TEXT,
            pickup_date TEXT,
            return_date TEXT,
            duration_days INTEGER DEFAULT 1,
            remarks TEXT,
            verified_by TEXT REFERENCES users(id) ON DELETE SET NULL,
            verified_at TEXT,
            created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
            updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
          );
        `);

        const itemsSelect = paymentCols.has('items_json') ? 'items_json' : 'NULL';
        const pickupSelect = paymentCols.has('pickup_date') ? 'pickup_date' : 'NULL';
        const returnSelect = paymentCols.has('return_date') ? 'return_date' : 'NULL';
        const durationSelect = paymentCols.has('duration_days') ? 'duration_days' : '1';
        const remarksSelect = paymentCols.has('remarks') ? 'remarks' : 'NULL';

        db.exec(`
          INSERT INTO payments_new (
            id, receipt_reference, user_id, reservation_id, rental_id, tool_id,
            amount_centavos, payment_method, status, proof_url,
            items_json, pickup_date, return_date, duration_days, remarks,
            verified_by, verified_at, created_at, updated_at
          )
          SELECT
            id, receipt_reference, user_id, reservation_id, rental_id, tool_id,
            amount_centavos, payment_method, status, proof_url,
            ${itemsSelect}, ${pickupSelect}, ${returnSelect}, ${durationSelect}, ${remarksSelect},
            verified_by, verified_at, created_at, updated_at
          FROM payments;
        `);

        db.exec('DROP TABLE payments;');
        db.exec('ALTER TABLE payments_new RENAME TO payments;');
        db.exec('CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);');
        db.exec('CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);');
      })();
    } finally {
      db.pragma('foreign_keys = ON');
    }
  }
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
