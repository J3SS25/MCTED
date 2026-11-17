import db from '../../db/client.js';
import type { Payment, CreatePaymentInput, VerifyPaymentInput, PaymentStatus } from '@mcteb/shared';
import { generateUUID } from '../utils/crypto.js';

export interface PaymentWithDetails extends Payment {
  payer_name: string;
  payer_email: string;
  payer_barangay: string;
  payer_phone: string;
  payer_address: string;
  payer_province: string;
  payer_age: number | null;
  payer_birth_date: string;
  tool_name: string | null;
  tool_category: string | null;
  tool_rental_fee_centavos: number | null;
  tool_deposit_fee_centavos: number | null;
  reservation_quantity: number | null;
  reservation_pickup_date: string | null;
  reservation_return_date: string | null;
  reservation_purpose: string | null;
  rental_quantity: number | null;
  rental_due_date: string | null;
  rental_notes: string | null;
  verifier_name: string | null;
}

const PAYMENT_DETAIL_SELECT = `
  SELECT
    p.*,
    u.full_name as payer_name,
    u.email as payer_email,
    u.barangay as payer_barangay,
    u.phone as payer_phone,
    u.address as payer_address,
    u.province as payer_province,
    u.age as payer_age,
    u.birth_date as payer_birth_date,
    t.name as tool_name,
    t.category as tool_category,
    t.rental_fee_centavos as tool_rental_fee_centavos,
    t.deposit_fee_centavos as tool_deposit_fee_centavos,
    res.quantity as reservation_quantity,
    res.pickup_date as reservation_pickup_date,
    res.return_date as reservation_return_date,
    res.purpose as reservation_purpose,
    rent.quantity as rental_quantity,
    rent.due_date as rental_due_date,
    rent.inspection_notes as rental_notes,
    v.full_name as verifier_name
  FROM payments p
  JOIN users u ON p.user_id = u.id
  LEFT JOIN tools t ON p.tool_id = t.id
  LEFT JOIN reservations res ON p.reservation_id = res.id
  LEFT JOIN rentals rent ON p.rental_id = rent.id
  LEFT JOIN users v ON p.verified_by = v.id
`;

export class PaymentsRepository {
  static findById(id: string): PaymentWithDetails | null {
    const stmt = db.prepare(`
      ${PAYMENT_DETAIL_SELECT}
      WHERE p.id = ?
    `);
    const row = stmt.get(id);
    return (row as PaymentWithDetails) || null;
  }

  static findByUserId(userId: string): PaymentWithDetails[] {
    const stmt = db.prepare(`
      ${PAYMENT_DETAIL_SELECT}
      WHERE p.user_id = ?
      ORDER BY datetime(p.created_at) DESC
    `);
    return stmt.all(userId) as PaymentWithDetails[];
  }

  static findAll(status?: PaymentStatus): PaymentWithDetails[] {
    let sql = PAYMENT_DETAIL_SELECT;
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
    const status: PaymentStatus = input.status ?? 'Pending';
    const verifiedAt = status === 'Paid' ? new Date().toISOString() : null;
    const stmt = db.prepare(`
      INSERT INTO payments (
        id, receipt_reference, user_id, reservation_id, rental_id, tool_id,
        amount_centavos, payment_method, status, proof_url,
        items_json, pickup_date, return_date, duration_days, remarks, verified_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      status,
      input.proof_url ?? null,
      input.items_json ?? null,
      input.pickup_date ?? null,
      input.return_date ?? null,
      input.duration_days ?? 1,
      input.remarks ?? null,
      verifiedAt,
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
