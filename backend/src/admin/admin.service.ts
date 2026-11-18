import db from '../../db/client.js';
import { env } from '../config/env.js';
import fs from 'node:fs';

export interface AdminOverviewStats {
  totalUsers: number;
  totalTools: number;
  activeRentals: number;
  pendingReservations: number;
  openMaintenance: number;
  recentAuditLogsCount: number;
}

export interface AdminSystemHealth {
  databasePath: string;
  databaseSizeBytes: number;
  userTableCount: number;
  uptimeSeconds: number;
  environment: string;
  nodeVersion: string;
}

export class AdminService {
  static getOverviewStats(): AdminOverviewStats {
    const usersCount = (
      db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
    ).count;
    const toolsCount = (
      db.prepare('SELECT COUNT(*) as count FROM tools').get() as { count: number }
    ).count;
    const rentalsCount = (
      db.prepare("SELECT COUNT(*) as count FROM rentals WHERE status = 'Borrowed'").get() as {
        count: number;
      }
    ).count;
    const reservationsCount = (
      db.prepare("SELECT COUNT(*) as count FROM reservations WHERE status = 'Pending'").get() as {
        count: number;
      }
    ).count;
    const maintenanceCount = (
      db
        .prepare(
          "SELECT COUNT(*) as count FROM maintenance WHERE status IN ('Reported', 'Scheduled', 'In Progress')",
        )
        .get() as { count: number }
    ).count;
    const auditCount = (
      db.prepare('SELECT COUNT(*) as count FROM audit_logs').get() as { count: number }
    ).count;

    return {
      totalUsers: usersCount,
      totalTools: toolsCount,
      activeRentals: rentalsCount,
      pendingReservations: reservationsCount,
      openMaintenance: maintenanceCount,
      recentAuditLogsCount: auditCount,
    };
  }

  static getSystemHealth(): AdminSystemHealth {
    let sizeBytes = 0;
    try {
      if (fs.existsSync(env.DATABASE_PATH_RESOLVED)) {
        sizeBytes = fs.statSync(env.DATABASE_PATH_RESOLVED).size;
      }
    } catch {
      sizeBytes = 0;
    }

    const tableCountRow = db
      .prepare<{
        count: number;
      }>(
        "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      )
      .get();

    return {
      databasePath: env.DATABASE_PATH_RESOLVED,
      databaseSizeBytes: sizeBytes,
      userTableCount: tableCountRow?.count ?? 0,
      uptimeSeconds: process.uptime(),
      environment: env.NODE_ENV,
      nodeVersion: process.version,
    };
  }
}
