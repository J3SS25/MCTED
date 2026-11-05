import { z } from 'zod';
import { ReservationStatusSchema } from '../enums.js';

export const ReservationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  tool_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  pickup_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pickup date must be YYYY-MM-DD'),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Return date must be YYYY-MM-DD'),
  purpose: z.string().nullable().optional(),
  status: ReservationStatusSchema,
  staff_notes: z.string().nullable().optional(),
  reviewed_by: z.string().uuid().nullable().optional(),
  reviewed_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Reservation = z.infer<typeof ReservationSchema>;

export const CreateReservationSchema = z.object({
  tool_id: z.string().uuid('Valid tool ID required'),
  quantity: z.number().int().positive('Quantity must be at least 1').default(1),
  pickup_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pickup date must be YYYY-MM-DD'),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Return date must be YYYY-MM-DD'),
  purpose: z.string().max(255).optional(),
}).refine(data => new Date(data.pickup_date) <= new Date(data.return_date), {
  message: 'Return date must be on or after pickup date',
  path: ['return_date'],
});

export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;

export const ReviewReservationSchema = z.object({
  decision: z.enum(['Approved', 'Rejected']),
  staff_notes: z.string().max(500).optional(),
});

export type ReviewReservationInput = z.infer<typeof ReviewReservationSchema>;

