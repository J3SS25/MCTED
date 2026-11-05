import db from '../../db/client.js';
import type { Rental, CheckoutRentalInput, ReturnRentalInput, RentalStatus } from '@mcteb/shared';
import { generateUUID } from '../../utils/crypto.js';

export interface RentalWithDetails extends Rental {
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

export class RentalsRepository {
  static findById(id: string): RentalWithDetails | null {
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
      FROM rentals r
      JOIN tools t ON r.tool_id = t.id
      JOIN users u ON r.user_id = u.id
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
        t.rental_fee_centavos,
        t.deposit_fee_centavos,
        u.full_name as borrower_name,
        u.email as borrower_email,
        u.phone as borrower_phone,
        u.barangay as borrower_barangay
      FROM rentals r
      JOIN tools t ON r.tool_id = t.id
      JOIN users u ON r.user_id = u.id
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
        t.rental_fee_centavos,
        t.deposit_fee_centavos,
        u.full_name as borrower_name,
        u.email as borrower_email,
        u.phone as borrower_phone,
        u.barangay as borrower_barangay
      FROM rentals r
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
    return stmt.all(...params) as RentalWithDetails[];
  }

  static createCheckout(input: CheckoutRentalInput, releaserId: string): Rental {
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
        overdue_penalty_centavos = ?,
        damage_penalty_centavos = ?,
        received_by = ?,
        updated_at = DATETIME('now')
      WHERE id = ?
      RETURNING *
    `);

    return (stmt.get(
      input.returned_condition,
      input.inspection_notes ?? null,
      input.overdue_penalty_centavos,
      input.damage_penalty_centavos,
      receiverId,
      id,
    ) as Rental) || null;
  }
}

