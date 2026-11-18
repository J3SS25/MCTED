import db from '../../db/client.js';
import type { Rental, ReleaseRentalInput, ReturnRentalInput, RentalStatus } from '@mcteb/shared';
import { generateUUID } from '../utils/crypto.js';

export interface RentalWithDetails extends Rental {
  tool_name: string;
  tool_category: string;
  tool_image_url: string | null;
  tool_serial_number?: string | null;
  borrower_name: string;
  borrower_email: string;
  borrower_phone: string;
  borrower_barangay: string;
  borrower_address?: string;
  borrower_province?: string;
  pickup_date?: string | null;
  purpose?: string | null;
  released_by_name?: string | null;
  received_by_name?: string | null;
}

export class RentalsRepository {
  static findById(id: string): RentalWithDetails | null {
    const stmt = db.prepare(`
      SELECT
        r.*,
        t.name as tool_name,
        t.category as tool_category,
        t.image_url as tool_image_url,
        t.serial_number as tool_serial_number,
        u.full_name as borrower_name,
        u.email as borrower_email,
        u.phone as borrower_phone,
        u.barangay as borrower_barangay,
        u.address as borrower_address,
        u.province as borrower_province,
        res.pickup_date as pickup_date,
        res.purpose as purpose,
        rel.full_name as released_by_name,
        rec.full_name as received_by_name
      FROM rentals r
      JOIN tools t ON r.tool_id = t.id
      JOIN users u ON r.user_id = u.id
      LEFT JOIN reservations res ON r.reservation_id = res.id
      LEFT JOIN users rel ON r.released_by = rel.id
      LEFT JOIN users rec ON r.received_by = rec.id
      WHERE r.id = ?
    `);
    const row = stmt.get(id);
    return (row as RentalWithDetails) || null;
  }

  static findByUserId(userId: string): RentalWithDetails[] {
    const stmt = db.prepare(`
      SELECT
        r.*,
        t.name as tool_name,
        t.category as tool_category,
        t.image_url as tool_image_url,
        t.serial_number as tool_serial_number,
        u.full_name as borrower_name,
        u.email as borrower_email,
        u.phone as borrower_phone,
        u.barangay as borrower_barangay,
        u.address as borrower_address,
        u.province as borrower_province,
        res.pickup_date as pickup_date,
        res.purpose as purpose,
        rel.full_name as released_by_name,
        rec.full_name as received_by_name
      FROM rentals r
      JOIN tools t ON r.tool_id = t.id
      JOIN users u ON r.user_id = u.id
      LEFT JOIN reservations res ON r.reservation_id = res.id
      LEFT JOIN users rel ON r.released_by = rel.id
      LEFT JOIN users rec ON r.received_by = rec.id
      WHERE r.user_id = ?
      ORDER BY datetime(r.created_at) DESC
    `);
    return stmt.all(userId) as RentalWithDetails[];
  }

  static findAll(status?: RentalStatus): RentalWithDetails[] {
    let sql = `
      SELECT
        r.*,
        t.name as tool_name,
        t.category as tool_category,
        t.image_url as tool_image_url,
        t.serial_number as tool_serial_number,
        u.full_name as borrower_name,
        u.email as borrower_email,
        u.phone as borrower_phone,
        u.barangay as borrower_barangay,
        u.address as borrower_address,
        u.province as borrower_province,
        res.pickup_date as pickup_date,
        res.purpose as purpose,
        rel.full_name as released_by_name,
        rec.full_name as received_by_name
      FROM rentals r
      JOIN tools t ON r.tool_id = t.id
      JOIN users u ON r.user_id = u.id
      LEFT JOIN reservations res ON r.reservation_id = res.id
      LEFT JOIN users rel ON r.released_by = rel.id
      LEFT JOIN users rec ON r.received_by = rec.id
    `;
    const params: string[] = [];

    if (status) {
      sql += ' WHERE r.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY datetime(r.created_at) DESC';

    const stmt = db.prepare(sql);
    return stmt.all(...params) as RentalWithDetails[];
  }

  static createRelease(input: ReleaseRentalInput, releaserId: string): Rental {
    const id = generateUUID();
    const stmt = db.prepare(`
      INSERT INTO rentals (
        id, reservation_id, user_id, tool_id, quantity, due_date, status,
        initial_condition, inspection_notes, released_by
      )
      VALUES (?, ?, ?, ?, ?, ?, 'Borrowed', ?, ?, ?)
      RETURNING *
    `);

    return stmt.get(
      id,
      input.reservation_id ?? null,
      input.user_id,
      input.tool_id,
      input.quantity,
      input.due_date,
      input.initial_condition,
      input.inspection_notes ?? null,
      releaserId,
    ) as Rental;
  }

  static processReturn(id: string, input: ReturnRentalInput, receiverId: string): Rental | null {
    const stmt = db.prepare(`
      UPDATE rentals
      SET
        status = 'Returned',
        returned_at = DATETIME('now'),
        returned_condition = ?,
        inspection_notes = COALESCE(?, inspection_notes),
        received_by = ?,
        updated_at = DATETIME('now')
      WHERE id = ?
      RETURNING *
    `);

    return (
      (stmt.get(
        input.returned_condition,
        input.inspection_notes ?? null,
        receiverId,
        id,
      ) as Rental) || null
    );
  }
}
