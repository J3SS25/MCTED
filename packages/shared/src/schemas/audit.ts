import { z } from 'zod';

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  actor_id: z.string().uuid().nullable().optional(),
  actor_name: z.string().min(1).max(100),
  action: z.string().min(1).max(100),
  target_type: z.string().min(1).max(50),
  target_id: z.string().min(1).max(100),
  details: z.string().nullable().optional(),
  ip_address: z.string().nullable().optional(),
  created_at: z.string(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

export const CreateAuditLogSchema = z.object({
  actor_id: z.string().uuid().optional(),
  actor_name: z.string().min(1).max(100),
  action: z.string().min(1).max(100),
  target_type: z.string().min(1).max(50),
  target_id: z.string().min(1).max(100),
  details: z.string().optional(),
  ip_address: z.string().optional(),
});

export type CreateAuditLogInput = z.infer<typeof CreateAuditLogSchema>;

export const AuditLogFilterSchema = z.object({
  action: z.string().optional(),
  target_type: z.string().optional(),
  target_id: z.string().optional(),
  actor_id: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type AuditLogFilterInput = z.infer<typeof AuditLogFilterSchema>;

