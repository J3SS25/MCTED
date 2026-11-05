import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { formatDateTime } from '@mcteb/shared';
export function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const fetchNotifications = async () => {
        try {
            const data = await apiRequest('/notifications');
            setNotifications(data);
        }
        catch (err) {
            console.error('Failed to load notifications', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchNotifications();
    }, []);
    const handleMarkAsRead = async (id) => {
        try {
            await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
        }
        catch (err) {
            console.error('Failed to mark notification read', err);
        }
    };
    const handleMarkAllRead = async () => {
        try {
            await apiRequest('/notifications/mark-all-read', { method: 'POST' });
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
        }
        catch (err) {
            console.error('Failed to mark all notifications read', err);
        }
    };
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    if (loading) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-8 w-48" }), _jsx(Skeleton, { className: "h-20 rounded-xl" }), _jsx(Skeleton, { className: "h-20 rounded-xl" })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100", children: "Notifications & System Alerts" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1", children: "Status updates regarding your equipment requests, approvals, due dates, and payments." })] }), unreadCount > 0 && (_jsxs(Button, { size: "sm", variant: "outline", onClick: handleMarkAllRead, className: "gap-1.5 self-start sm:self-auto", children: [_jsx(CheckCheck, { className: "h-4 w-4" }), " Mark All as Read"] }))] }), notifications.length === 0 ? (_jsx(EmptyState, { icon: _jsx(Bell, { className: "h-12 w-12 text-slate-400 stroke-1" }), title: "No notifications yet", description: "You are all caught up with your equipment loan updates." })) : (_jsx("div", { className: "space-y-3", children: notifications.map((n) => (_jsx(Card, { className: `transition-colors ${!n.is_read
                        ? 'border-l-4 border-l-civic-forest bg-emerald-50/20 dark:bg-emerald-950/20'
                        : ''}`, children: _jsxs(CardContent, { className: "p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { status: n.type }), _jsx("h4", { className: "font-semibold text-sm text-slate-900 dark:text-slate-100", children: n.title }), !n.is_read && (_jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-500" }))] }), _jsx("p", { className: "text-xs text-slate-600 dark:text-slate-300", children: n.message }), _jsx("p", { className: "text-[11px] text-slate-400", children: formatDateTime(n.created_at) })] }), _jsxs("div", { className: "flex items-center gap-2 self-end sm:self-center", children: [!n.is_read && (_jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleMarkAsRead(n.id), children: "Mark Read" })), n.link_url && (_jsx(Link, { to: n.link_url, children: _jsxs(Button, { size: "sm", variant: "outline", className: "gap-1", children: ["View ", _jsx(ExternalLink, { className: "h-3 w-3" })] }) }))] })] }) }, n.id))) }))] }));
}
//# sourceMappingURL=NotificationsPage.js.map