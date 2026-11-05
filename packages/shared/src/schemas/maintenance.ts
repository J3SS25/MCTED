import { z } from 'zod';
import { MaintenanceSeveritySchema, MaintenanceStatusSchema } from '../enums.js';

export const MaintenanceSchema = z.object({
  id: z.string().uuid(),
  tool_id: z.string().uuid(),
  rental_id: z.string().uuid().nullable().optional(),
  reported_by: z.string().uuid(),
  issue_description: z.string().min(5),
  severity: MaintenanceSeveritySchema,
  status: MaintenanceStatusSchema,
  technician_name: z.string().nullable().optional(),
  estimated_cost_centavos: z.number().int().nonnegative().default(0),
  actual_cost_centavos: z.number().int().nonnegative().default(0),
  scheduled_date: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  resolution_notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Maintenance = z.infer<typeof MaintenanceSchema>;

export const CreateMaintenanceSchema = z.object({
  tool_id: z.string().uuid(),
  rental_id: z.string().uuid().optional(),
  issue_description: z.string().min(5, 'Description must be at least 5 characters'),
  severity: MaintenanceSeveritySchema,
  technician_name: z.string().optional(),
  estimated_cost_centavos: z.number().int().nonnegative().default(0),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateMaintenanceInput = z.infer<typeof CreateMaintenanceSchema>;

export const UpdateMaintenanceSchema = z.object({
  status: MaintenanceStatusSchema.optional(),
  technician_name: z.string().optional(),
  actual_cost_centavos: z.number().int().nonnegative().optional(),
  resolution_notes: z.string().optional(),
  return_to_service: z.boolean().default(false),
});

export type UpdateMaintenanceInput = z.infer<typeof UpdateMaintenanceSchema>;

