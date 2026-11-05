import db from '../../db/client.js';
import type { Payment, CreatePaymentInput, VerifyPaymentInput, PaymentStatus } from '@mcteb/shared';
import { generateUUID } from '../../utils/crypto.js';

export interface PaymentWithDetails extends Payment {
  payer_name: string;
  payer_email: string;
  payer_barangay: string;
  tool_name: string | null;
  verifier_name: string | null;
}

export class PaymentsRepository {
  static findById(id: string): PaymentWithDetails | null {
    const stmt = db.prepare(`
      SELECT
        p.*,
        u.full_name as payer_name,
        u.email as payer_email,
        u.barangay as payer_barangay,
        t.name as tool_name,
        v.full_name as verifier_name
      FROM payments p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN tools t ON p.tool_id = t.id
      LEFT JOIN users v ON p.verified_by = v.id
      WHERE p.id = ?
    `);
    const row = stmt.get(id);
    return (row as PaymentWithDetails) || null;
  }

  static findByUserId(userId: string): PaymentWithDetails[] {
    const stmt = db.prepare(`
      SELECT
        p.*,
        u.full_name as payer_name,
        u.email as payer_email,
        u.barangay as payer_barangay,
        t.name as tool_name,
        v.full_name as verifier_name
      FROM payments p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN tools t ON p.tool_id = t.id
      LEFT JOIN users v ON p.verified_by = v.id
      WHERE p.user_id = ?
      ORDER BY datetime(p.created_at) DESC
    `);
    return stmt.all(userId) as PaymentWithDetails[];
  }

  static findAll(status?: PaymentStatus): PaymentWithDetails[] {
    let sql = `
      SELECT
        p.*,
        u.full_name as payer_name,
        u.email as payer_email,
        u.barangay as payer_barangay,
        t.name as tool_name,
        v.full_name as verifier_name
      FROM payments p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN tools t ON p.tool_id = t.id
      LEFT JOIN users v ON p.verified_by = v.id
    `;
    const params: string[] = [];

    if (status) {
      sql += ' WHERE p.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY datetime(p.created_at) DESC';

    const stmt = db.prepare(sql);
    return stmt.all(...params) as PaymentWithDetails[];
  }

  static create(userId: string, input: CreatePaymentInput, receiptRef: string): Payment {
    const id = generateUUID();
    const stmt = db.prepare(`
      INSERT INTO payments (
        id, receipt_reference, user_id, reservation_id, rental_id, tool_id,
        amount_centavos, payment_method, status, proof_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
      RETURNING *
    `);

    return stmt.get(
      id,
      receiptRef,
      userId,
      input.reservation_id ?? null,
      input.rental_id ?? null,
      input.tool_id ?? null,
      input.amount_centavos,
      input.payment_method,
      input.proof_url ?? null,
    ) as Payment;
  }

  static verify(id: string, input: VerifyPaymentInput, verifierId: string): Payment | null {
    const stmt = db.prepare(`
      UPDATE payments
      SET
        status = ?,
        verified_by = ?,
        verified_at = DATETIME('now'),
        updated_at = DATETIME('now')
      WHERE id = ?
      RETURNING *
    `);

    return (stmt.get(input.status, verifierId, id) as Payment) || null;
  }

  static generateReceiptReference(): string {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `BASCO-PAY-${year}-${randomSuffix}`;
  }
}

