import db from '../../db/client.js';
import type { Reservation, CreateReservationInput, ReservationStatus } from '@mcteb/shared';
import { generateUUID } from '../../utils/crypto.js';

export interface ReservationWithDetails extends Reservation {
  tool_name: string;
  tool_category: string;
  tool_image_url: string | null;
  rental_fee_centavos: number;
  deposit_fee_centavos: number;
  borrower_name: string;
  borrower_email: string;
  borrower_phone: string;
  borrower_barangay: string;
}

export class ReservationsRepository {
  static findById(id: string): ReservationWithDetails | null {
    const stmt = db.prepare(`
      SELECT
        r.*,
        t.name as tool_name,
        t.category as tool_category,
        t.image_url as tool_image_url,
        t.rental_fee_centavos,
        t.deposit_fee_centavos,
        u.full_name as borrower_name,
        u.email as borrower_email,
        u.phone as borrower_phone,
        u.barangay as borrower_barangay
      FROM reservations r
      JOIN tools t ON r.tool_id = t.id
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `);
    const row = stmt.get(id);
    return (row as ReservationWithDetails) || null;
  }

  static findByUserId(userId: string): ReservationWithDetails[] {
    const stmt = db.prepare(`
      SELECT
        r.*,
        t.name as tool_name,
        t.category as tool_category,
        t.image_url as tool_image_url,
        t.rental_fee_centavos,
        t.deposit_fee_centavos,
        u.full_name as borrower_name,
        u.email as borrower_email,
        u.phone as borrower_phone,
        u.barangay as borrower_barangay
      FROM reservations r
      JOIN tools t ON r.tool_id = t.id
      JOIN users u ON r.user_id = u.id
      WHERE r.user_id = ?
      ORDER BY datetime(r.created_at) DESC
    `);
    return stmt.all(userId) as ReservationWithDetails[];
  }

  static findAll(status?: ReservationStatus): ReservationWithDetails[] {
    let sql = `
      SELECT
        r.*,
        t.name as tool_name,
        t.category as tool_category,
        t.image_url as tool_image_url,
        t.rental_fee_centavos,
        t.deposit_fee_centavos,
        u.full_name as borrower_name,
        u.email as borrower_email,
        u.phone as borrower_phone,
        u.barangay as borrower_barangay
      FROM reservations r
      JOIN tools t ON r.tool_id = t.id
      JOIN users u ON r.user_id = u.id
    `;
    const params: string[] = [];

    if (status) {
      sql += ' WHERE r.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY datetime(r.created_at) DESC';

    const stmt = db.prepare(sql);
    return stmt.all(...params) as ReservationWithDetails[];
  }

  static getActiveReservedQuantityForDates(toolId: string, pickupDate: string, returnDate: string): number {
    const stmt = db.prepare(`
      SELECT COALESCE(SUM(quantity), 0) as total_reserved
      FROM reservations
      WHERE tool_id = ?
        AND status IN ('Pending', 'Approved')
        AND NOT (return_date < ? OR pickup_date > ?)
    `);
    const row = stmt.get(toolId, pickupDate, returnDate) as { total_reserved: number };
    return row ? row.total_reserved : 0;
  }

  static create(userId: string, input: CreateReservationInput): Reservation {
    const id = generateUUID();
    const stmt = db.prepare(`
      INSERT INTO reservations (
        id, user_id, tool_id, quantity, pickup_date, return_date, purpose, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
      RETURNING *
    `);

    return stmt.get(
      id,
      userId,
      input.tool_id,
      input.quantity,
      input.pickup_date,
      input.return_date,
      input.purpose ?? null,
    ) as Reservation;
  }

  static updateDecision(id: string, decision: 'Approved' | 'Rejected', reviewerId: string, notes?: string): Reservation | null {
    const stmt = db.prepare(`
      UPDATE reservations
      SET
        status = ?,
        reviewed_by = ?,
        reviewed_at = DATETIME('now'),
        staff_notes = ?,
        updated_at = DATETIME('now')
      WHERE id = ?
      RETURNING *
    `);

    return (stmt.get(decision, reviewerId, notes ?? null, id) as Reservation) || null;
  }

  static updateStatus(id: string, status: ReservationStatus): Reservation | null {
    const stmt = db.prepare(`
      UPDATE reservations
      SET status = ?, updated_at = DATETIME('now')
      WHERE id = ?
      RETURNING *
    `);
    return (stmt.get(status, id) as Reservation) || null;
  }
}

