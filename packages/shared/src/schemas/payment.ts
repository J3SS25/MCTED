import { z } from 'zod';
import { PaymentMethodSchema, PaymentStatusSchema } from '../enums.js';

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
  proof_url: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

export const VerifyPaymentSchema = z.object({
  status: z.enum(['Paid', 'Failed', 'Refunded']),
  notes: z.string().optional(),
});

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;

