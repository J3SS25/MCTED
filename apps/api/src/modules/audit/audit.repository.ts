import db from '../../db/client.js';
import type { AuditLog, CreateAuditLogInput, AuditLogFilterInput } from '@mcteb/shared';
import { generateUUID } from '../../utils/crypto.js';

export class AuditRepository {
  static create(input: CreateAuditLogInput): AuditLog {
    const id = generateUUID();
    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_name, action, target_type, target_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);

    return stmt.get(
      id,
      input.actor_id ?? null,
      input.actor_name,
      input.action,
      input.target_type,
      input.target_id,
      input.details ?? null,
      input.ip_address ?? null,
    ) as AuditLog;
  }

  static findMany(filters: AuditLogFilterInput): { items: AuditLog[]; total: number } {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters.action) {
      conditions.push('action = ?');
      params.push(filters.action);
    }
    if (filters.target_type) {
      conditions.push('target_type = ?');
      params.push(filters.target_type);
    }
    if (filters.target_id) {
      conditions.push('target_id = ?');
      params.push(filters.target_id);
    }
    if (filters.actor_id) {
      conditions.push('actor_id = ?');
      params.push(filters.actor_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM audit_logs ${whereClause}`);
    const totalRow = countStmt.get(...params) as { count: number };
    const total = totalRow ? totalRow.count : 0;

    const offset = (filters.page - 1) * filters.limit;
    const queryStmt = db.prepare(`
      SELECT * FROM audit_logs
      ${whereClause}
      ORDER BY datetime(created_at) DESC
      LIMIT ? OFFSET ?
    `);

    const items = queryStmt.all(...params, filters.limit, offset) as AuditLog[];

    return { items, total };
  }
}

