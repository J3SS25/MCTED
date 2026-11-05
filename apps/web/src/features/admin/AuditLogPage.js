import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ShieldCheck, Search } from 'lucide-react';
import { formatDateTime } from '@mcteb/shared';
export function AuditLogPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);
    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (actionFilter)
                params.append('action', actionFilter);
            params.append('limit', '50');
            const data = await apiRequest(`/audit?${params.toString()}`);
            setLogs(data.items);
        }
        catch (err) {
            console.error('Failed to load audit logs', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchLogs();
    }, []);
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchLogs();
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100", children: "Municipal System Audit Log" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1", children: "Immutable audit trail of all administrative actions, approvals, inventory changes, and logins." })] }), _jsxs("form", { onSubmit: handleSearchSubmit, className: "flex gap-2", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-2.5 h-4 w-4 text-slate-400" }), _jsx("input", { type: "text", placeholder: "Filter by action code (e.g. RESERVATION_APPROVED, TOOL_CREATED, USER_LOGIN)...", value: actionFilter, onChange: (e) => setActionFilter(e.target.value), className: "w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-accent" })] }), _jsx(Button, { type: "submit", size: "md", children: "Filter" })] }), loading ? (_jsxs("div", { className: "space-y-3", children: [_jsx(Skeleton, { className: "h-12 w-full rounded-xl" }), _jsx(Skeleton, { className: "h-16 w-full rounded-xl" }), _jsx(Skeleton, { className: "h-16 w-full rounded-xl" })] })) : logs.length === 0 ? (_jsx(EmptyState, { icon: _jsx(ShieldCheck, { className: "h-12 w-12 text-slate-400 stroke-1" }), title: "No audit entries", description: "No recorded audit actions match your search query." })) : (_jsx("div", { className: "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-left text-xs", children: [_jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-700 dark:text-slate-300", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3", children: "Timestamp" }), _jsx("th", { className: "px-4 py-3", children: "Actor" }), _jsx("th", { className: "px-4 py-3", children: "Action" }), _jsx("th", { className: "px-4 py-3", children: "Target" }), _jsx("th", { className: "px-4 py-3", children: "Details" }), _jsx("th", { className: "px-4 py-3 text-right", children: "Inspect" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-700/60 font-mono", children: logs.map((log) => (_jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-700/30", children: [_jsx("td", { className: "px-4 py-3 whitespace-nowrap text-slate-500 font-sans", children: formatDateTime(log.created_at) }), _jsx("td", { className: "px-4 py-3 whitespace-nowrap font-sans font-semibold text-slate-800 dark:text-slate-200", children: log.actor_name }), _jsx("td", { className: "px-4 py-3 whitespace-nowrap", children: _jsx("span", { className: "px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200", children: log.action }) }), _jsxs("td", { className: "px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400", children: [log.target_type, ": ", log.target_id.slice(0, 8)] }), _jsx("td", { className: "px-4 py-3 font-sans text-slate-600 dark:text-slate-300 max-w-xs truncate", children: log.details || '—' }), _jsx("td", { className: "px-4 py-3 text-right font-sans", children: _jsx(Button, { size: "sm", variant: "ghost", onClick: () => setSelectedLog(log), children: "Details" }) })] }, log.id))) })] }) }) })), selectedLog && (_jsx(Modal, { isOpen: !!selectedLog, onClose: () => setSelectedLog(null), title: `Audit Log Record: ${selectedLog.action}`, children: _jsxs("div", { className: "space-y-3 text-xs", children: [_jsxs("div", { className: "p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-1 font-mono", children: [_jsxs("p", { children: [_jsx("strong", { children: "Log ID:" }), " ", selectedLog.id] }), _jsxs("p", { children: [_jsx("strong", { children: "Actor:" }), " ", selectedLog.actor_name, " (", selectedLog.actor_id || 'System', ")"] }), _jsxs("p", { children: [_jsx("strong", { children: "Action:" }), " ", selectedLog.action] }), _jsxs("p", { children: [_jsx("strong", { children: "Target Type:" }), " ", selectedLog.target_type] }), _jsxs("p", { children: [_jsx("strong", { children: "Target ID:" }), " ", selectedLog.target_id] }), _jsxs("p", { children: [_jsx("strong", { children: "IP Address:" }), " ", selectedLog.ip_address || 'Internal'] }), _jsxs("p", { children: [_jsx("strong", { children: "Recorded At:" }), " ", formatDateTime(selectedLog.created_at)] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-bold text-slate-700 dark:text-slate-300 mb-1", children: "Details & Remarks:" }), _jsx("p", { className: "p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200 whitespace-pre-wrap", children: selectedLog.details || 'No additional details provided.' })] }), _jsx("div", { className: "pt-2 flex justify-end", children: _jsx(Button, { type: "button", size: "sm", onClick: () => setSelectedLog(null), children: "Close" }) })] }) }))] }));
}
//# sourceMappingURL=AuditLogPage.js.map