import { z } from 'zod';
import { ToolAvailabilityStatusSchema, ToolConditionStatusSchema } from '../enums.js';

export const ToolSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(150),
  category: z.string().min(2).max(50),
  description: z.string().min(5),
  specifications: z.string().nullable().optional(),
  availability_status: ToolAvailabilityStatusSchema,
  condition_status: ToolConditionStatusSchema,
  total_quantity: z.number().int().positive(),
  available_quantity: z.number().int().nonnegative(),
  serial_number: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  image_urls: z.array(z.string()).max(5).optional(),
  owner_id: z.string().uuid().nullable().optional(),
  owner_name: z.string().nullable().optional(),
  owner_role: z.string().nullable().optional(),
  owner_email: z.string().nullable().optional(),
  owner_barangay: z.string().nullable().optional(),
  owner_phone: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Tool = z.infer<typeof ToolSchema>;

export const CreateToolSchema = z.object({
  name: z.string().min(2).max(150),
  category: z.string().min(2).max(50),
  description: z.string().min(5),
  specifications: z.string().optional(),
  availability_status: ToolAvailabilityStatusSchema.default('Available'),
  condition_status: ToolConditionStatusSchema.default('Good'),
  total_quantity: z.number().int().positive(),
  serial_number: z.string().optional(),
  image_url: z.string().optional(),
  image_urls: z
    .array(z.string())
    .max(5, 'You can upload a maximum of 5 images per tool or equipment.')
    .optional(),
  image_filenames: z.array(z.string()).max(5).optional(),
});

export type CreateToolInput = z.infer<typeof CreateToolSchema>;

export const UpdateToolSchema = CreateToolSchema.partial().extend({
  available_quantity: z.number().int().nonnegative().optional(),
});

export type UpdateToolInput = z.infer<typeof UpdateToolSchema>;

export const ToolFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  availability: ToolAvailabilityStatusSchema.optional(),
  condition: ToolConditionStatusSchema.optional(),
  owner_id: z.string().optional(),
  sort_by: z.enum(['name_asc', 'name_desc', 'newest', 'availability']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
});

export type ToolFilterInput = z.infer<typeof ToolFilterSchema>;
