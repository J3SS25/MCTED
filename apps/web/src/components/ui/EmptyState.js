import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';
export function EmptyState({ icon = _jsx(PackageOpen, { className: "h-12 w-12 text-slate-400 stroke-1" }), title, description, actionText, onAction, }) {
    return (_jsxs("div", { className: "flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl", children: [_jsx("div", { className: "mb-3", children: icon }), _jsx("h3", { className: "text-base font-semibold text-slate-800 dark:text-slate-200 mb-1", children: title }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4", children: description }), actionText && onAction && (_jsx(Button, { size: "sm", onClick: onAction, children: actionText }))] }));
}
//# sourceMappingURL=EmptyState.js.map