import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const Input = React.forwardRef(({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (_jsxs("div", { className: "w-full", children: [label && (_jsx("label", { htmlFor: inputId, className: "block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5", children: label })), _jsx("input", { id: inputId, ref: ref, className: twMerge(clsx('w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-colors', error
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-slate-300 dark:border-slate-600 focus:ring-civic-accent focus:border-civic-accent', className)), ...props }), error ? (_jsx("p", { className: "mt-1 text-xs text-red-600 dark:text-red-400 font-medium", children: error })) : helperText ? (_jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: helperText })) : null] }));
});
Input.displayName = 'Input';
export const Select = React.forwardRef(({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id || props.name;
    return (_jsxs("div", { className: "w-full", children: [label && (_jsx("label", { htmlFor: selectId, className: "block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5", children: label })), _jsx("select", { id: selectId, ref: ref, className: twMerge(clsx('w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-colors', error
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-slate-300 dark:border-slate-600 focus:ring-civic-accent focus:border-civic-accent', className)), ...props, children: options.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) }), error && _jsx("p", { className: "mt-1 text-xs text-red-600 dark:text-red-400 font-medium", children: error })] }));
});
Select.displayName = 'Select';
//# sourceMappingURL=Input.js.map