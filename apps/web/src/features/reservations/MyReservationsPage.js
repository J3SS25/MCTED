import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Skeleton';
import { CalendarCheck } from 'lucide-react';
import { formatDate } from '@mcteb/shared';
export function MyReservationsPage() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);
    const [message, setMessage] = useState(null);
    const fetchReservations = async () => {
        try {
            const data = await apiRequest('/reservations');
            setReservations(data);
        }
        catch (err) {
            console.error('Failed to load reservations', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchReservations();
    }, []);
    const handleCancel = async (id) => {
        if (!confirm('Are you sure you want to cancel this reservation?'))
            return;
        setCancellingId(id);
        setMessage(null);
        try {
            await apiRequest(`/reservations/${id}/cancel`, { method: 'POST' });
            setMessage('Reservation was successfully cancelled.');
            await fetchReservations();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to cancel reservation');
        }
        finally {
            setCancellingId(null);
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-8 w-48" }), _jsx(Skeleton, { className: "h-24 rounded-xl" }), _jsx(Skeleton, { className: "h-24 rounded-xl" })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100", children: "My Tool Reservations" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1", children: "Review the status of your municipal tool booking requests." })] }), message && _jsx(Alert, { variant: "success", children: message }), reservations.length === 0 ? (_jsx(EmptyState, { icon: _jsx(CalendarCheck, { className: "h-12 w-12 text-slate-400 stroke-1" }), title: "No reservations found", description: "You haven't requested any shared equipment bookings yet.", actionText: "Browse Equipment Catalog", onAction: () => (window.location.href = '/catalog') })) : (_jsx("div", { className: "space-y-4", children: reservations.map((res) => {
                    const canCancel = res.status === 'Pending' || res.status === 'Approved';
                    return (_jsx(Card, { children: _jsxs(CardContent, { className: "p-5 flex flex-col md:flex-row md:items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-700/50 p-2 flex items-center justify-center flex-shrink-0", children: _jsx("img", { src: res.tool_image_url || '/equipment/fallback.svg', alt: res.tool_name, className: "max-h-full max-w-full object-contain", onError: (e) => {
                                                    e.target.src = '/equipment/fallback.svg';
                                                } }) }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "font-bold text-base text-slate-900 dark:text-slate-100", children: res.tool_name }), _jsx(Badge, { status: res.status })] }), _jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: [res.quantity, " unit(s) \u2022 Pickup: ", _jsx("strong", { children: formatDate(res.pickup_date) }), " \u2022 Due: ", _jsx("strong", { children: formatDate(res.return_date) })] }), res.purpose && (_jsxs("p", { className: "text-xs text-slate-600 dark:text-slate-300 italic", children: ["Purpose: \"", res.purpose, "\""] })), res.staff_notes && (_jsxs("p", { className: "text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded inline-block", children: ["Staff Note: ", res.staff_notes] }))] })] }), _jsxs("div", { className: "flex items-center gap-2 self-end md:self-center", children: [canCancel && (_jsx(Button, { variant: "outline", size: "sm", className: "text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30", isLoading: cancellingId === res.id, onClick: () => handleCancel(res.id), children: "Cancel Request" })), _jsx(Link, { to: `/catalog/${res.tool_id}`, children: _jsx(Button, { variant: "ghost", size: "sm", children: "View Tool" }) })] })] }) }, res.id));
                }) }))] }));
}
//# sourceMappingURL=MyReservationsPage.js.map