import type { UserRole } from './enums.js';

export const Permissions = {
  // Public / Catalog
  CATALOG_VIEW: ['Guest', 'Borrower', 'Municipal Staff', 'Administrator'] as const,
  FEEDBACK_VIEW_PUBLIC: ['Guest', 'Borrower', 'Municipal Staff', 'Administrator'] as const,

  // Borrower Operations
  RESERVATION_CREATE: ['Borrower'] as const,
  RESERVATION_VIEW_OWN: ['Borrower'] as const,
  RESERVATION_CANCEL_OWN: ['Borrower'] as const,
  RENTAL_VIEW_OWN: ['Borrower'] as const,
  PAYMENT_SUBMIT_OWN: ['Borrower'] as const,
  PAYMENT_VIEW_OWN: ['Borrower'] as const,
  FEEDBACK_SUBMIT: ['Borrower'] as const,
  PROFILE_VIEW_UPDATE_OWN: ['Borrower', 'Municipal Staff', 'Administrator'] as const,
  NOTIFICATIONS_VIEW_OWN: ['Borrower', 'Municipal Staff', 'Administrator'] as const,

  // Staff Operations
  RESERVATION_VIEW_ALL: ['Municipal Staff', 'Administrator'] as const,
  RESERVATION_REVIEW: ['Municipal Staff', 'Administrator'] as const,
  RENTAL_CHECKOUT: ['Municipal Staff', 'Administrator'] as const,
  RENTAL_RETURN: ['Municipal Staff', 'Administrator'] as const,
  RENTAL_VIEW_ALL: ['Municipal Staff', 'Administrator'] as const,
  TOOL_MANAGE: ['Municipal Staff', 'Administrator'] as const,
  PAYMENT_VERIFY: ['Municipal Staff', 'Administrator'] as const,
  PAYMENT_VIEW_ALL: ['Municipal Staff', 'Administrator'] as const,
  MAINTENANCE_MANAGE: ['Municipal Staff', 'Administrator'] as const,
  FEEDBACK_MODERATE: ['Municipal Staff', 'Administrator'] as const,

  // Admin Operations
  USER_VIEW_ALL: ['Administrator'] as const,
  USER_STATUS_UPDATE: ['Administrator'] as const,
  USER_ROLE_UPDATE: ['Administrator'] as const,
  AUDIT_LOG_VIEW: ['Administrator'] as const,
} as const;

export type PermissionAction = keyof typeof Permissions;

export function hasPermission(role: UserRole | 'Guest', action: PermissionAction): boolean {
  const allowedRoles = Permissions[action] as readonly string[];
  return allowedRoles.includes(role);
}

