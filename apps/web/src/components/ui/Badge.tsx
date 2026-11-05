import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: string;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ className, status, variant, children, ...props }: BadgeProps) {
  let computedVariant: 'neutral' | 'success' | 'warning' | 'danger' | 'info' = variant || 'neutral';

  if (status) {
    switch (status) {
      case 'Available':
      case 'Active':
      case 'Approved':
      case 'Paid':
      case 'Completed':
      case 'Excellent':
      case 'success':
        computedVariant = 'success';
        break;
      case 'Pending':
      case 'Pending Verification':
      case 'Reserved':
      case 'Good':
      case 'Scheduled':
      case 'warning':
        computedVariant = 'warning';
        break;
      case 'Borrowed':
      case 'In Progress':
      case 'Fair':
      case 'info':
        computedVariant = 'info';
        break;
      case 'Rejected':
      case 'Cancelled':
      case 'Failed':
      case 'Suspended':
      case 'Damaged':
      case 'Needs Repair':
      case 'Severe':
      case 'Critical':
      case 'danger':
        computedVariant = 'danger';
        break;
      case 'Returned':
      case 'Archived':
      case 'Decommissioned':
      case 'Under Maintenance':
      case 'Moderate':
      case 'Minor':
      default:
        computedVariant = 'neutral';
        break;
    }
  }

  const variants = {
    neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    info: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
          variants[computedVariant],
          className,
        ),
      )}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {children || status}
    </span>
  );
}

