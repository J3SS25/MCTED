import db from '../client.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
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

    // 2. Remove active sessions for demo users
    const sessionStmt = db.prepare('DELETE FROM sessions WHERE user_id = ?');
    for (const uid of userIds) {
      const res = sessionStmt.run(uid);
      counts.sessionsRemoved += Number(res.changes);
    }

    // 3. Remove demo feedback (by demo user or demo tool)
    const fbStmt = db.prepare('DELETE FROM feedback WHERE user_id = ? OR tool_id = ?');
    for (const uid of userIds) {
      const res = fbStmt.run(uid, '');
      counts.feedbackRemoved += Number(res.changes);
    }
    for (const tid of toolIds) {
      const res = fbStmt.run('', tid);
      counts.feedbackRemoved += Number(res.changes);
    }

    // 4. Remove demo payments (by demo user or demo tool)
    const payStmt = db.prepare('DELETE FROM payments WHERE user_id = ? OR tool_id = ?');
    for (const uid of userIds) {
      const res = payStmt.run(uid, '');
      counts.paymentsRemoved += Number(res.changes);
    }
    for (const tid of toolIds) {
      const res = payStmt.run('', tid);
      counts.paymentsRemoved += Number(res.changes);
    }

    // 5. Remove maintenance tickets associated with demo tools or reported by demo users
    const maintStmt = db.prepare('DELETE FROM maintenance WHERE tool_id = ? OR reported_by = ?');
    for (const tid of toolIds) {
      const res = maintStmt.run(tid, '');
      counts.maintenanceRemoved += Number(res.changes);
    }
    for (const uid of userIds) {
      const res = maintStmt.run('', uid);
      counts.maintenanceRemoved += Number(res.changes);
    }

    // 6. Remove demo rentals (by demo user or demo tool)
    const rentStmt = db.prepare('DELETE FROM rentals WHERE user_id = ? OR tool_id = ?');
    for (const uid of userIds) {
      const res = rentStmt.run(uid, '');
      counts.rentalsRemoved += Number(res.changes);
    }
    for (const tid of toolIds) {
      const res = rentStmt.run('', tid);
      counts.rentalsRemoved += Number(res.changes);
    }

    // 7. Remove demo reservations (by demo user or demo tool)
    const resStmt = db.prepare('DELETE FROM reservations WHERE user_id = ? OR tool_id = ?');
    for (const uid of userIds) {
      const result = resStmt.run(uid, '');
      counts.reservationsRemoved += Number(result.changes);
    }
    for (const tid of toolIds) {
      const result = resStmt.run('', tid);
      counts.reservationsRemoved += Number(result.changes);
    }

    // 8. Remove demo tools
    const toolStmt = db.prepare('DELETE FROM tools WHERE id = ?');
    for (const t of SEED_TOOLS) {
      const res = toolStmt.run(t.id);
      counts.toolsRemoved += Number(res.changes);
    }

    // 9. Remove demo users
    const userStmt = db.prepare('DELETE FROM users WHERE id = ? OR email = ?');
    for (const u of SEED_USERS) {
      const res = userStmt.run(u.id, u.email);
      counts.usersRemoved += Number(res.changes);
    }

    // 10. Remove seed audit logs
    db.prepare("DELETE FROM audit_logs WHERE id = 'f7000000-0000-4000-8000-000000000001'").run();
  });

  resetTx();

  logger.info(
    `Demo reset complete: Removed ${counts.usersRemoved} users, ${counts.toolsRemoved} tools, ${counts.reservationsRemoved} reservations, ${counts.rentalsRemoved} rentals, ${counts.paymentsRemoved} payments, ${counts.maintenanceRemoved} maintenance, ${counts.feedbackRemoved} feedback records.`,
  );
  logger.info('Non-demo custom records remain preserved.');

  return counts;
}

if (process.argv[1]?.endsWith('reset-demo.ts') || process.argv[1]?.endsWith('reset-demo.js')) {
  try {
    const force = process.argv.includes('--force') || process.argv.includes('-y');
    resetDemoData(force);
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Demo reset failed');
    process.exit(1);
  }
}
