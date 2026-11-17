import { z } from 'zod';
import { PaymentMethodSchema, PaymentStatusSchema } from '../enums.js';

export const ReceiptItemSchema = z.object({
  tool_id: z.string().optional(),
  tool_name: z.string(),
  category: z.string().optional(),
  quantity: z.number().int().positive(),
  unit_cost_centavos: z.number().int().nonnegative(),
  deposit_fee_centavos: z.number().int().nonnegative().default(0),
  duration_days: z.number().int().positive().default(1),
  subtotal_centavos: z.number().int().nonnegative(),
});

export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  receipt_reference: z.string().min(3).max(50),
  user_id: z.string().uuid(),
  reservation_id: z.string().uuid().nullable().optional(),
  rental_id: z.string().uuid().nullable().optional(),
  tool_id: z.string().uuid().nullable().optional(),
  amount_centavos: z.number().int().positive(),
  payment_method: PaymentMethodSchema,
  status: PaymentStatusSchema,
  proof_url: z.string().nullable().optional(),
  items_json: z.string().nullable().optional(),
  pickup_date: z.string().nullable().optional(),
  return_date: z.string().nullable().optional(),
  duration_days: z.number().int().positive().nullable().optional(),
  remarks: z.string().nullable().optional(),
  verified_by: z.string().uuid().nullable().optional(),
  verified_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Payment = z.infer<typeof PaymentSchema>;

export const CreatePaymentSchema = z.object({
  reservation_id: z.string().uuid().optional(),
  rental_id: z.string().uuid().optional(),
  tool_id: z.string().uuid().optional(),
  amount_centavos: z.number().int().positive('Payment amount must be greater than zero'),
  payment_method: PaymentMethodSchema,
  status: PaymentStatusSchema.optional(),
  proof_url: z.string().optional(),
  items_json: z.string().nullable().optional(),
  pickup_date: z.string().nullable().optional(),
  return_date: z.string().nullable().optional(),
  duration_days: z.coerce.number().int().positive().nullable().optional(),
  remarks: z.string().max(500).nullable().optional(),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

export const VerifyPaymentSchema = z.object({
  status: z.enum(['Paid', 'Failed', 'Refunded']),
  notes: z.string().optional(),
});

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;
