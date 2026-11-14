import { z } from 'zod';

export const BorrowRequestStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'returned',
  'cancelled',
]);
export type BorrowRequestStatus = z.infer<typeof BorrowRequestStatusSchema>;

export const CreateBorrowRequestSchema = z.object({
  item_id: z.string().uuid('Item ID must be a valid UUID'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  request_message: z.string().max(500, 'Request message must not exceed 500 characters').optional(),
});
export type CreateBorrowRequestInput = z.infer<typeof CreateBorrowRequestSchema>;

export const UpdateBorrowRequestStatusSchema = z.object({
  status: BorrowRequestStatusSchema,
});
export type UpdateBorrowRequestStatusInput = z.infer<typeof UpdateBorrowRequestStatusSchema>;

export const BorrowRequestSchema = z.object({
  id: z.string().uuid(),
  item_id: z.string().uuid(),
  borrower_id: z.string().uuid(),
  lender_id: z.string().uuid(),
  start_date: z.string(),
  end_date: z.string(),
  status: BorrowRequestStatusSchema,
  request_message: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  tool_name: z.string().optional(),
  tool_category: z.string().optional(),
  daily_rate_centavos: z.number().int().nonnegative().optional(),
  rental_fee_centavos: z.number().int().nonnegative().optional(),
  tool_image_url: z.string().nullable().optional(),
  borrower_name: z.string().optional(),
  lender_name: z.string().optional(),
});
export type BorrowRequest = z.infer<typeof BorrowRequestSchema>;

