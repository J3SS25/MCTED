import { z } from 'zod';
import { UserRoleSchema, UserStatusSchema, BarangaySchema } from '../enums.js';

export const UserSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Phone number must be at least 7 digits').max(20),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be YYYY-MM-DD'),
  barangay: BarangaySchema,
  address: z.string().min(5, 'Address must be at least 5 characters').max(255),
  role: UserRoleSchema,
  status: UserStatusSchema,
  failed_login_attempts: z.number().int().nonnegative().default(0),
  lockout_until: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export const RegisterUserSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(7, 'Phone number must be at least 7 digits').max(20),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be YYYY-MM-DD'),
  barangay: BarangaySchema,
  address: z.string().min(5, 'Address must be at least 5 characters').max(255),
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const UpdateProfileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  barangay: BarangaySchema.optional(),
  address: z.string().min(5).max(255).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const UpdateUserStatusSchema = z.object({
  status: UserStatusSchema,
  reason: z.string().min(3, 'A reason for status change is required'),
});

export type UpdateUserStatusInput = z.infer<typeof UpdateUserStatusSchema>;

export const UpdateUserRoleSchema = z.object({
  role: UserRoleSchema,
  reason: z.string().min(3, 'A reason for role change is required'),
});

export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;

