import { jsx as _jsx } from "react/jsx-runtime";
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function Card({ className, children, ...props }) {
    return (_jsx("div", { className: twMerge(clsx('bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden', className)), ...props, children: children }));
}
export function CardHeader({ className, children, ...props }) {
    return (_jsx("div", { className: twMerge(clsx('px-6 py-4 border-b border-slate-100 dark:border-slate-700/60', className)), ...props, children: children }));
}
export function CardTitle({ className, children, ...props }) {
    return (_jsx("h3", { className: twMerge(clsx('text-base font-semibold text-slate-900 dark:text-slate-100', className)), ...props, children: children }));
}
export function CardContent({ className, children, ...props }) {
    return (_jsx("div", { className: twMerge(clsx('p-6', className)), ...props, children: children }));
}
//# sourceMappingURL=Card.js.map