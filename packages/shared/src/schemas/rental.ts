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
  released_by: z.string().uuid().nullable().optional(),
  received_by: z.string().uuid().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Rental = z.infer<typeof RentalSchema>;

export const ReleaseRentalSchema = z.object({
  reservation_id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  tool_id: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  initial_condition: ToolConditionStatusSchema,
  inspection_notes: z.string().optional(),
});

export type ReleaseRentalInput = z.infer<typeof ReleaseRentalSchema>;

export const ReturnRentalSchema = z.object({
  returned_condition: ToolConditionStatusSchema,
  inspection_notes: z.string().optional(),
});

export type ReturnRentalInput = z.infer<typeof ReturnRentalSchema>;
