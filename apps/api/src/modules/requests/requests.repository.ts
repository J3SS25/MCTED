import db from '../../db/client.js';
import { generateUUID } from '../../utils/crypto.js';
import type { Tool } from '@mcteb/shared';

export interface BorrowRequestRecord {
  id: string;
  item_id: string;
  borrower_id: string;
  lender_id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'cancelled';
  request_message: string | null;
  created_at: string;
  updated_at: string;
  tool?: Tool;
  borrower_name?: string;
  lender_name?: string;
}

export class RequestsRepository {
  static findById(id: string): BorrowRequestRecord | null {
    const stmt = db.prepare(`
      SELECT 
        r.*,
        b.full_name as borrower_name,
        l.full_name as lender_name,
        t.name as tool_name,
        t.category as tool_category,
        t.daily_rate_centavos,
        t.rental_fee_centavos,
        t.image_url as tool_image_url
      FROM borrow_requests r
      LEFT JOIN users b ON r.borrower_id = b.id
      LEFT JOIN users l ON r.lender_id = l.id
      LEFT JOIN tools t ON r.item_id = t.id
      WHERE r.id = ?
    `);
    const row = stmt.get(id);
    return (row as BorrowRequestRecord) || null;
  }

  static findForUser(userId: string, isStaffOrAdmin: boolean = false): BorrowRequestRecord[] {
    if (isStaffOrAdmin) {
      const stmt = db.prepare(`
        SELECT 
          r.*,
          b.full_name as borrower_name,
          l.full_name as lender_name,
          t.name as tool_name,
          t.category as tool_category,
          t.daily_rate_centavos,
          t.rental_fee_centavos,
          t.image_url as tool_image_url
        FROM borrow_requests r
        LEFT JOIN users b ON r.borrower_id = b.id
        LEFT JOIN users l ON r.lender_id = l.id
        LEFT JOIN tools t ON r.item_id = t.id
        ORDER BY r.created_at DESC
      `);
      return stmt.all() as BorrowRequestRecord[];
    }

    const stmt = db.prepare(`
      SELECT 
        r.*,
        b.full_name as borrower_name,
        l.full_name as lender_name,
        t.name as tool_name,
        t.category as tool_category,
        t.daily_rate_centavos,
        t.rental_fee_centavos,
        t.image_url as tool_image_url
      FROM borrow_requests r
      LEFT JOIN users b ON r.borrower_id = b.id
      LEFT JOIN users l ON r.lender_id = l.id
      LEFT JOIN tools t ON r.item_id = t.id
      WHERE r.borrower_id = ? OR r.lender_id = ?
      ORDER BY r.created_at DESC
    `);
    return stmt.all(userId, userId) as BorrowRequestRecord[];
  }

  static hasOverlappingBooking(itemId: string, startDate: string, endDate: string, excludeRequestId?: string): boolean {
    let sql = `
      SELECT COUNT(*) as count 
      FROM borrow_requests
      WHERE item_id = ?
        AND status IN ('pending', 'approved')
        AND date(start_date) <= date(?)
        AND date(end_date) >= date(?)
    `;
    const params: string[] = [itemId, endDate, startDate];

    if (excludeRequestId) {
      sql += ' AND id <> ?';
      params.push(excludeRequestId);
    }

    const row = db.prepare(sql).get(...params) as { count: number };
    return Boolean(row && row.count > 0);
  }

  static create(data: {
    item_id: string;
    borrower_id: string;
    lender_id: string;
    start_date: string;
    end_date: string;
    request_message?: string;
  }): BorrowRequestRecord {
    const id = generateUUID();
    const stmt = db.prepare(`
      INSERT INTO borrow_requests (
        id, item_id, borrower_id, lender_id, start_date, end_date, status, request_message
      )
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
      RETURNING *
    `);

    stmt.run(
      id,
      data.item_id,
      data.borrower_id,
      data.lender_id,
      data.start_date,
      data.end_date,
      data.request_message ?? null,
    );

    return this.findById(id)!;
  }

  static updateStatus(id: string, status: string): BorrowRequestRecord | null {
    db.prepare(`
      UPDATE borrow_requests
      SET status = ?, updated_at = DATETIME('now')
      WHERE id = ?
    `).run(status, id);

    return this.findById(id);
  }
}

