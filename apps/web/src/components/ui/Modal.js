import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { X } from 'lucide-react';
export function Modal({ isOpen, onClose, title, children, maxWidth = 'md' }) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    const maxWidths = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
    };
    return (_jsxs("div", { className: "fixed inset-0 z-50 overflow-y-auto", children: [_jsx("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity", onClick: onClose, "aria-hidden": "true" }), _jsx("div", { className: "flex min-h-full items-center justify-center p-4 text-center sm:p-0", children: _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title", className: `relative transform overflow-hidden rounded-xl bg-white dark:bg-slate-800 text-left shadow-2xl transition-all w-full ${maxWidths[maxWidth]} border border-slate-200 dark:border-slate-700`, children: [_jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-6 py-4", children: [_jsx("h3", { id: "modal-title", className: "text-base font-semibold text-slate-900 dark:text-slate-100", children: title }), _jsx("button", { onClick: onClose, className: "rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-500 focus:outline-none", "aria-label": "Close modal", children: _jsx(X, { className: "h-5 w-5" }) })] }), _jsx("div", { className: "p-6", children: children })] }) })] }));
}
//# sourceMappingURL=Modal.js.map