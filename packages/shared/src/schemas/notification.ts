import { z } from 'zod';
import { NotificationTypeSchema } from '../enums.js';

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  type: NotificationTypeSchema,
  link_url: z.string().nullable().optional(),
  is_read: z.number().int().min(0).max(1),
  created_at: z.string(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const CreateNotificationSchema = z.object({
  user_id: z.string().uuid(),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  type: NotificationTypeSchema.default('info'),
  link_url: z.string().optional(),
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;

