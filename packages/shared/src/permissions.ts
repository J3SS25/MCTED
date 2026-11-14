import type { UserRole } from './enums.js';

export const Permissions = {
  // Public / Catalog
  CATALOG_VIEW: ['Guest', 'Borrower', 'Lender', 'Municipal Staff', 'Staff', 'Administrator', 'Admin'] as const,
  FEEDBACK_VIEW_PUBLIC: ['Guest', 'Borrower', 'Lender', 'Municipal Staff', 'Staff', 'Administrator', 'Admin'] as const,

  // Borrower & Lender Operations
  RESERVATION_CREATE: ['Borrower', 'Lender'] as const,
  RESERVATION_VIEW_OWN: ['Borrower', 'Lender'] as const,
  RESERVATION_CANCEL_OWN: ['Borrower', 'Lender'] as const,
  RENTAL_VIEW_OWN: ['Borrower', 'Lender'] as const,
  PAYMENT_SUBMIT_OWN: ['Borrower', 'Lender'] as const,
  PAYMENT_VIEW_OWN: ['Borrower', 'Lender'] as const,
  FEEDBACK_SUBMIT: ['Borrower', 'Lender'] as const,
  PROFILE_VIEW_UPDATE_OWN: ['Borrower', 'Lender', 'Municipal Staff', 'Staff', 'Administrator', 'Admin'] as const,
  NOTIFICATIONS_VIEW_OWN: ['Borrower', 'Lender', 'Municipal Staff', 'Staff', 'Administrator', 'Admin'] as const,

  // Staff Operations
  RESERVATION_VIEW_ALL: ['Municipal Staff', 'Staff', 'Administrator', 'Admin'] as const,
  RESERVATION_REVIEW: ['Municipal Staff', 'Staff', 'Administrator', 'Admin'] as const,
  RENTAL_CHECKOUT: ['Municipal Staff', 'Staff', 'Administrator', 'Admin'] as const,
  RENTAL_RETURN: ['Municipal Staff', 'Staff', 'Administrator', 'Admin'] as const,
  RENTAL_VIEW_ALL: ['Municipal Staff', 'Staff', 'Administrator', 'Admin'] as const,
  TOOL_MANAGE: ['Municipal Staff', 'Staff', 'Administrator', 'Admin', 'Lender', 'Borrower'] as const,
  PAYMENT_VERIFY: ['Municipal Staff', 'Staff', 'Administrator', 'Admin'] as const,
  PAYMENT_VIEW_ALL: ['Municipal Staff', 'Staff', 'Administrator', 'Admin'] as const,
  MAINTENANCE_MANAGE: ['Municipal Staff', 'Staff', 'Administrator', 'Admin'] as const,
  FEEDBACK_MODERATE: ['Municipal Staff', 'Staff', 'Administrator', 'Admin'] as const,

  // Admin Operations
  USER_VIEW_ALL: ['Administrator', 'Admin'] as const,
  USER_STATUS_UPDATE: ['Administrator', 'Admin'] as const,
  USER_ROLE_UPDATE: ['Administrator', 'Admin'] as const,
  AUDIT_LOG_VIEW: ['Administrator', 'Admin'] as const,
} as const;

export type PermissionAction = keyof typeof Permissions;

export function hasPermission(role: UserRole | 'Guest', action: PermissionAction): boolean {
  const allowedRoles = Permissions[action] as readonly string[];
  return allowedRoles.includes(role);
}

