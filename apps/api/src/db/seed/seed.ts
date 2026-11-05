import db from '../client.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { hashPassword } from '../../utils/crypto.js';
import { validateFixtures } from './validate-fixtures.js';
import {
  SEED_USERS,
  SEED_TOOLS,
  SEED_RESERVATIONS,
  SEED_RENTALS,
  SEED_PAYMENTS,
  SEED_FEEDBACK,
} from './fixtures/index.js';
import { runMigrations } from '../migrate.js';

export async function runSeed(): Promise<void> {
  // Environmental safety guard
  if (env.NODE_ENV === 'production' && !env.ALLOW_DEMO_SEED) {
    logger.error('Refusing to run demo seed in production without ALLOW_DEMO_SEED=true');
    throw new Error('Demo seed prohibited in production');
  }

  logger.info('Starting MCTEB database seeding...');

  // Ensure tables exist
  runMigrations();

  // Validate relational consistency
  const report = validateFixtures({
    users: SEED_USERS,
    tools: SEED_TOOLS,
    reservations: SEED_RESERVATIONS,
    rentals: SEED_RENTALS,
    payments: SEED_PAYMENTS,
  });

  if (!report.valid) {
    logger.error({ errors: report.errors }, 'Fixture validation failed');
    throw new Error(`Fixture validation failed with ${report.errors.length} error(s)`);
  }

  // Common demo password hashed with scrypt
  const defaultPasswordHash = await hashPassword('Basco@2026!');

  const seedTransaction = db.transaction(() => {
    // 1. Seed Users
    const userStmt = db.prepare(`
      INSERT OR IGNORE INTO users (
        id, full_name, email, password_hash, phone, birth_date, barangay, address, role, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const u of SEED_USERS) {
      userStmt.run(
        u.id,
        u.full_name,
        u.email,
        defaultPasswordHash,
        u.phone,
        u.birth_date,
        u.barangay,
        u.address,
        u.role,
        u.status,
      );
    }
    logger.info(`Seeded ${SEED_USERS.length} demo users`);

    // 2. Seed Tools
    const toolStmt = db.prepare(`
      INSERT OR IGNORE INTO tools (
        id, name, category, description, specifications, availability_status, condition_status,
        rental_fee_centavos, deposit_fee_centavos, total_quantity, available_quantity, serial_number, image_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const t of SEED_TOOLS) {
      toolStmt.run(
        t.id,
        t.name,
        t.category,
        t.description,
        t.specifications,
        t.availability_status,
        t.condition_status,
        t.rental_fee_centavos,
        t.deposit_fee_centavos,
        t.total_quantity,
        t.available_quantity,
        t.serial_number,
        t.image_url,
      );
    }
    logger.info(`Seeded ${SEED_TOOLS.length} catalog tools`);

    // 3. Seed Reservations
    const resStmt = db.prepare(`
      INSERT OR IGNORE INTO reservations (
        id, user_id, tool_id, quantity, pickup_date, return_date, purpose, status, staff_notes, reviewed_by, reviewed_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const r of SEED_RESERVATIONS) {
      resStmt.run(
        r.id,
        r.user_id,
        r.tool_id,
        r.quantity,
        r.pickup_date,
        r.return_date,
        r.purpose,
        r.status,
        r.staff_notes,
        r.reviewed_by,
        r.reviewed_at,
      );
    }

    // 4. Seed Rentals
    const rentStmt = db.prepare(`
      INSERT OR IGNORE INTO rentals (
        id, reservation_id, user_id, tool_id, quantity, due_date, returned_at, status,
        initial_condition, returned_condition, inspection_notes, overdue_penalty_centavos,
        damage_penalty_centavos, released_by, received_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const rent of SEED_RENTALS) {
      rentStmt.run(
        rent.id,
        rent.reservation_id,
        rent.user_id,
        rent.tool_id,
        rent.quantity,
        rent.due_date,
        rent.returned_at,
        rent.status,
        rent.initial_condition,
        rent.returned_condition,
        rent.inspection_notes,
        rent.overdue_penalty_centavos,
        rent.damage_penalty_centavos,
        rent.released_by,
        rent.received_by,
      );
    }

    // 5. Seed Payments
    const payStmt = db.prepare(`
      INSERT OR IGNORE INTO payments (
        id, receipt_reference, user_id, reservation_id, rental_id, tool_id, amount_centavos,
        payment_method, status, proof_url, verified_by, verified_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of SEED_PAYMENTS) {
      payStmt.run(
        p.id,
        p.receipt_reference,
        p.user_id,
        p.reservation_id,
        p.rental_id,
        p.tool_id,
        p.amount_centavos,
        p.payment_method,
        p.status,
        p.proof_url,
        p.verified_by,
        p.verified_at,
      );
    }

    // 6. Seed Feedback
    const fbStmt = db.prepare(`
      INSERT OR IGNORE INTO feedback (
        id, user_id, tool_id, rental_id, overall_rating, tool_condition_rating, service_rating, comments, is_public
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const f of SEED_FEEDBACK) {
      fbStmt.run(
        f.id,
        f.user_id,
        f.tool_id,
        f.rental_id,
        f.overall_rating,
        f.tool_condition_rating,
        f.service_rating,
        f.comments,
        f.is_public,
      );
    }

    // 7. Seed System Audit Log
    db.prepare(`
      INSERT OR IGNORE INTO audit_logs (id, actor_name, action, target_type, target_id, details)
      VALUES (?, 'System Initializer', 'SEED_COMPLETED', 'system', 'basco-batanes', 'Initialized demo fixtures and municipal catalog')
    `).run('f7000000-0000-4000-8000-000000000001');

    logger.info('Database seeding completed successfully.');
  });

  seedTransaction();
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error({ err }, 'Seeding failed');
      process.exit(1);
    });
}

