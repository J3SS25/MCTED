import db from '../client.js';
import { env } from '../../src/config/env.js';
import { logger } from '../../src/utils/logger.js';
import { SEED_USERS, SEED_TOOLS } from './fixtures/index.js';

export function resetDemoData(force = false): {
  usersRemoved: number;
  toolsRemoved: number;
  reservationsRemoved: number;
  rentalsRemoved: number;
  paymentsRemoved: number;
  maintenanceRemoved: number;
  feedbackRemoved: number;
  notificationsRemoved: number;
  sessionsRemoved: number;
} {
  if (env.NODE_ENV === 'production' && !env.ALLOW_DEMO_SEED) {
    logger.error('Refusing to reset demo data in production without ALLOW_DEMO_SEED=true');
    throw new Error('Demo reset prohibited in production environment');
  }

  const isInteractive = process.stdin.isTTY && !force;
  if (isInteractive && !process.argv.includes('--force') && !process.argv.includes('-y')) {
    logger.warn('Confirmation required: run with `--force` or `-y` to confirm demo data reset.');
  }

  logger.info(`Target Database: ${env.DATABASE_PATH_RESOLVED}`);
  logger.info('Resetting only designated demo records in reverse relational order...');

  const counts = {
    usersRemoved: 0,
    toolsRemoved: 0,
    reservationsRemoved: 0,
    rentalsRemoved: 0,
    paymentsRemoved: 0,
    maintenanceRemoved: 0,
    feedbackRemoved: 0,
    notificationsRemoved: 0,
    sessionsRemoved: 0,
  };

  const userIds = SEED_USERS.map((u) => u.id);
  const toolIds = SEED_TOOLS.map((t) => t.id);

  const resetTx = db.transaction(() => {
    // 1. Remove notifications for demo users
    const notifStmt = db.prepare('DELETE FROM notifications WHERE user_id = ?');
    for (const uid of userIds) {
      const res = notifStmt.run(uid);
      counts.notificationsRemoved += Number(res.changes);
    }

    // 2. Remove sessions for demo users
    const sessionStmt = db.prepare('DELETE FROM sessions WHERE user_id = ?');
    for (const uid of userIds) {
      const res = sessionStmt.run(uid);
      counts.sessionsRemoved += Number(res.changes);
    }

    // 3. Remove feedback for demo tools or users
    const fbStmt = db.prepare('DELETE FROM feedback WHERE user_id = ? OR tool_id = ?');
    for (const uid of userIds) {
      for (const tid of toolIds) {
        const res = fbStmt.run(uid, tid);
        counts.feedbackRemoved += Number(res.changes);
      }
    }

    // 4. Remove maintenance records for demo tools
    const maintStmt = db.prepare('DELETE FROM maintenance WHERE tool_id = ?');
    for (const tid of toolIds) {
      const res = maintStmt.run(tid);
      counts.maintenanceRemoved += Number(res.changes);
    }

    // 5. Remove payments for demo users
    const payStmt = db.prepare('DELETE FROM payments WHERE user_id = ?');
    for (const uid of userIds) {
      const res = payStmt.run(uid);
      counts.paymentsRemoved += Number(res.changes);
    }

    // 6. Remove rentals for demo users or tools
    const rentalStmt = db.prepare('DELETE FROM rentals WHERE user_id = ? OR tool_id = ?');
    for (const uid of userIds) {
      for (const tid of toolIds) {
        const res = rentalStmt.run(uid, tid);
        counts.rentalsRemoved += Number(res.changes);
      }
    }

    // 7. Remove reservations for demo users or tools
    const resStmt = db.prepare('DELETE FROM reservations WHERE user_id = ? OR tool_id = ?');
    for (const uid of userIds) {
      for (const tid of toolIds) {
        const res = resStmt.run(uid, tid);
        counts.reservationsRemoved += Number(res.changes);
      }
    }

    // 8. Remove demo tools
    const toolDelStmt = db.prepare('DELETE FROM tools WHERE id = ?');
    for (const tid of toolIds) {
      const res = toolDelStmt.run(tid);
      counts.toolsRemoved += Number(res.changes);
    }

    // 9. Remove demo users
    const userDelStmt = db.prepare('DELETE FROM users WHERE id = ?');
    for (const uid of userIds) {
      const res = userDelStmt.run(uid);
      counts.usersRemoved += Number(res.changes);
    }
  });

  resetTx();

  logger.info(counts, 'Demo data reset completed successfully');
  return counts;
}

if (process.argv[1]?.endsWith('reset-demo.ts') || process.argv[1]?.endsWith('reset-demo.js')) {
  try {
    resetDemoData(process.argv.includes('--force') || process.argv.includes('-y'));
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Reset demo failed');
    process.exit(1);
  }
}
