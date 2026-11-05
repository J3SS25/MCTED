import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Skeleton({ className = 'h-4 w-full' }) {
    return (_jsx("div", { className: `animate-pulse rounded bg-slate-200 dark:bg-slate-700/60 ${className}` }));
}
export function CardSkeleton() {
    return (_jsxs("div", { className: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm space-y-4", children: [_jsx(Skeleton, { className: "h-40 w-full rounded-lg" }), _jsx(Skeleton, { className: "h-5 w-3/4" }), _jsx(Skeleton, { className: "h-4 w-1/2" }), _jsxs("div", { className: "pt-2 flex justify-between items-center", children: [_jsx(Skeleton, { className: "h-6 w-20" }), _jsx(Skeleton, { className: "h-8 w-24 rounded-lg" })] })] }));
}
//# sourceMappingURL=Skeleton.js.map