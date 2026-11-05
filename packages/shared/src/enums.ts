import { z } from 'zod';

export const UserRoleSchema = z.enum(['Administrator', 'Municipal Staff', 'Borrower']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(['Active', 'Pending Verification', 'Suspended']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const ToolAvailabilityStatusSchema = z.enum([
  'Available',
  'Reserved',
  'Borrowed',
  'Returned',
  'Maintenance',
  'Damaged',
  'Archived',
]);
export type ToolAvailabilityStatus = z.infer<typeof ToolAvailabilityStatusSchema>;

export const ToolConditionStatusSchema = z.enum([
  'Excellent',
  'Good',
  'Fair',
  'Needs Repair',
  'Under Maintenance',
]);
export type ToolConditionStatus = z.infer<typeof ToolConditionStatusSchema>;

export const ReservationStatusSchema = z.enum([
  'Pending',
  'Approved',
  'Rejected',
  'Cancelled',
  'Completed',
]);
export type ReservationStatus = z.infer<typeof ReservationStatusSchema>;

export const RentalStatusSchema = z.enum([
  'Pending',
  'Reserved',
  'Borrowed',
  'Returned',
  'Completed',
]);
export type RentalStatus = z.infer<typeof RentalStatusSchema>;

export const PaymentStatusSchema = z.enum(['Pending', 'Paid', 'Failed', 'Refunded']);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PaymentMethodSchema = z.enum(['Cash', 'GCash', 'Bank Transfer', 'Municipal Treasury']);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const MaintenanceSeveritySchema = z.enum(['Minor', 'Moderate', 'Severe', 'Critical']);
export type MaintenanceSeverity = z.infer<typeof MaintenanceSeveritySchema>;

export const MaintenanceStatusSchema = z.enum([
  'Reported',
  'Scheduled',
  'In Progress',
  'Completed',
  'Decommissioned',
]);
export type MaintenanceStatus = z.infer<typeof MaintenanceStatusSchema>;

export const NotificationTypeSchema = z.enum(['info', 'success', 'warning', 'danger']);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const BarangaySchema = z.enum([
  'Chanarian',
  'Ihubok II (Kaychanarianan)',
  'Ihubok I (Kayvaluganan)',
  'Kayhuvokan',
  'San Antonio',
  'San Joaquin',
]);
export type Barangay = z.infer<typeof BarangaySchema>;

