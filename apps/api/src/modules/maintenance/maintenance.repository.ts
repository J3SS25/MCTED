import db from '../../db/client.js';
import type { Maintenance, CreateMaintenanceInput, UpdateMaintenanceInput, MaintenanceStatus } from '@mcteb/shared';
import { generateUUID } from '../../utils/crypto.js';

export interface MaintenanceWithDetails extends Maintenance {
  tool_name: string;
  tool_category: string;
  reporter_name: string;
}

export class MaintenanceRepository {
  static findById(id: string): MaintenanceWithDetails | null {
    const stmt = db.prepare(`
      SELECT
        m.*,
        t.name as tool_name,
        t.category as tool_category,
        u.full_name as reporter_name
      FROM maintenance m
      JOIN tools t ON m.tool_id = t.id
      JOIN users u ON m.reported_by = u.id
      WHERE m.id = ?
    `);
    const row = stmt.get(id);
    return (row as MaintenanceWithDetails) || null;
  }

  static findAll(status?: MaintenanceStatus): MaintenanceWithDetails[] {
    let sql = `
      SELECT
        m.*,
        t.name as tool_name,
        t.category as tool_category,
        u.full_name as reporter_name
      FROM maintenance m
      JOIN tools t ON m.tool_id = t.id
      JOIN users u ON m.reported_by = u.id
    `;
    const params: string[] = [];

    if (status) {
      sql += ' WHERE m.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY datetime(m.created_at) DESC';

    const stmt = db.prepare(sql);
    return stmt.all(...params) as MaintenanceWithDetails[];
  }

  static create(reporterId: string, input: CreateMaintenanceInput): Maintenance {
    const id = generateUUID();
    const stmt = db.prepare(`
      INSERT INTO maintenance (
        id, tool_id, rental_id, reported_by, issue_description, severity,
        status, technician_name, estimated_cost_centavos, scheduled_date
      )
      VALUES (?, ?, ?, ?, ?, ?, 'Reported', ?, ?, ?)
      RETURNING *
    `);

    return stmt.get(
      id,
      input.tool_id,
      input.rental_id ?? null,
      reporterId,
      input.issue_description,
      input.severity,
      input.technician_name ?? null,
      input.estimated_cost_centavos,
      input.scheduled_date ?? null,
    ) as Maintenance;
  }

  static update(id: string, input: UpdateMaintenanceInput): Maintenance | null {
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (input.status !== undefined) {
      fields.push('status = ?');
      values.push(input.status);
      if (input.status === 'Completed') {
        fields.push("completed_at = DATETIME('now')");
      }
    }
    if (input.technician_name !== undefined) {
      fields.push('technician_name = ?');
      values.push(input.technician_name);
    }
    if (input.actual_cost_centavos !== undefined) {
      fields.push('actual_cost_centavos = ?');
      values.push(input.actual_cost_centavos);
    }
    if (input.resolution_notes !== undefined) {
      fields.push('resolution_notes = ?');
      values.push(input.resolution_notes);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push("updated_at = DATETIME('now')");
    values.push(id);

    const stmt = db.prepare(`
      UPDATE maintenance
      SET ${fields.join(', ')}
      WHERE id = ?
      RETURNING *
    `);

    return (stmt.get(...values) as Maintenance) || null;
  }
}

