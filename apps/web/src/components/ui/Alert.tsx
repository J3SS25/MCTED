import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  onClose?: () => void;
}

export function Alert({ variant = 'info', title, onClose, children, className, ...props }: AlertProps) {
  const icons = {
    info: <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />,
    success: <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />,
  };

  const variants = {
    info: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200',
    warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200',
    error: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200',
  };

  return (
    <div
      role="alert"
      className={twMerge(
        clsx('flex gap-3 p-4 rounded-xl border text-sm', variants[variant], className),
      )}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="p-0.5 rounded opacity-70 hover:opacity-100 self-start focus:outline-none"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

