import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
export function Alert({ variant = 'info', title, children, className, ...props }) {
    const icons = {
        info: _jsx(Info, { className: "h-5 w-5 text-blue-500 flex-shrink-0" }),
        success: _jsx(CheckCircle, { className: "h-5 w-5 text-emerald-500 flex-shrink-0" }),
        warning: _jsx(AlertTriangle, { className: "h-5 w-5 text-amber-500 flex-shrink-0" }),
        error: _jsx(AlertCircle, { className: "h-5 w-5 text-red-500 flex-shrink-0" }),
    };
    const variants = {
        info: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200',
        success: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200',
        warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200',
        error: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200',
    };
    return (_jsxs("div", { role: "alert", className: twMerge(clsx('flex gap-3 p-4 rounded-xl border text-sm', variants[variant], className)), ...props, children: [icons[variant], _jsxs("div", { className: "flex-1", children: [title && _jsx("h4", { className: "font-semibold mb-1", children: title }), _jsx("div", { children: children })] })] }));
}
//# sourceMappingURL=Alert.js.map