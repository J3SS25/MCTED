import { z } from 'zod';
import { RentalStatusSchema, ToolConditionStatusSchema } from '../enums.js';

export const RentalSchema = z.object({
  id: z.string().uuid(),
  reservation_id: z.string().uuid().nullable().optional(),
  user_id: z.string().uuid(),
  tool_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
  returned_at: z.string().nullable().optional(),
  status: RentalStatusSchema,
  initial_condition: ToolConditionStatusSchema,
  returned_condition: ToolConditionStatusSchema.nullable().optional(),
  inspection_notes: z.string().nullable().optional(),
  overdue_penalty_centavos: z.number().int().nonnegative().default(0),
  damage_penalty_centavos: z.number().int().nonnegative().default(0),
  released_by: z.string().uuid().nullable().optional(),
  received_by: z.string().uuid().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Rental = z.infer<typeof RentalSchema>;

export const CheckoutRentalSchema = z.object({
  reservation_id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  tool_id: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  initial_condition: ToolConditionStatusSchema,
  inspection_notes: z.string().optional(),
});

export type CheckoutRentalInput = z.infer<typeof CheckoutRentalSchema>;

export const ReturnRentalSchema = z.object({
  returned_condition: ToolConditionStatusSchema,
  inspection_notes: z.string().optional(),
  overdue_penalty_centavos: z.number().int().nonnegative().default(0),
  damage_penalty_centavos: z.number().int().nonnegative().default(0),
});

export type ReturnRentalInput = z.infer<typeof ReturnRentalSchema>;

