import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { ShoppingBag, AlertTriangle } from 'lucide-react';
import { formatDate, formatPHP } from '@mcteb/shared';
export function MyRentalsPage() {
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function fetchRentals() {
            try {
                const data = await apiRequest('/rentals');
                setRentals(data);
            }
            catch (err) {
                console.error('Failed to load rentals', err);
            }
            finally {
                setLoading(false);
            }
        }
        fetchRentals();
    }, []);
    if (loading) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-8 w-48" }), _jsx(Skeleton, { className: "h-24 rounded-xl" }), _jsx(Skeleton, { className: "h-24 rounded-xl" })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100", children: "My Active & Past Equipment Loans" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1", children: "Keep track of due dates, equipment conditions, and inspection status." })] }), rentals.length === 0 ? (_jsx(EmptyState, { icon: _jsx(ShoppingBag, { className: "h-12 w-12 text-slate-400 stroke-1" }), title: "No loan records", description: "You do not currently have any active tool checkouts or past loan history.", actionText: "Browse Catalog", onAction: () => (window.location.href = '/catalog') })) : (_jsx("div", { className: "space-y-4", children: rentals.map((rental) => {
                    const isOverdue = rental.status === 'Borrowed' && new Date(rental.due_date) < new Date();
                    return (_jsx(Card, { children: _jsxs(CardContent, { className: "p-5 flex flex-col md:flex-row md:items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-700/50 p-2 flex items-center justify-center flex-shrink-0", children: _jsx("img", { src: rental.tool_image_url || '/equipment/fallback.svg', alt: rental.tool_name, className: "max-h-full max-w-full object-contain", onError: (e) => {
                                                    e.target.src = '/equipment/fallback.svg';
                                                } }) }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "font-bold text-base text-slate-900 dark:text-slate-100", children: rental.tool_name }), _jsx(Badge, { status: rental.status }), isOverdue && (_jsxs("span", { className: "px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 flex items-center gap-1", children: [_jsx(AlertTriangle, { className: "h-3 w-3" }), " OVERDUE"] }))] }), _jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: ["Quantity: ", rental.quantity, " unit(s) \u2022 Due Date: ", _jsx("strong", { children: formatDate(rental.due_date) })] }), _jsxs("p", { className: "text-xs text-slate-600 dark:text-slate-300", children: ["Condition: Released as ", _jsx("strong", { children: rental.initial_condition }), rental.returned_condition && ` → Returned as ${rental.returned_condition}`] }), rental.inspection_notes && (_jsxs("p", { className: "text-xs text-slate-500 italic", children: ["Staff notes: \"", rental.inspection_notes, "\""] })), (rental.overdue_penalty_centavos > 0 || rental.damage_penalty_centavos > 0) && (_jsxs("p", { className: "text-xs font-semibold text-red-600", children: ["Total Penalties: ", formatPHP(rental.overdue_penalty_centavos + rental.damage_penalty_centavos)] }))] })] }), _jsxs("div", { className: "text-right self-end md:self-center", children: [_jsx("p", { className: "text-xs text-slate-400", children: "Reference ID" }), _jsx("p", { className: "text-xs font-mono text-slate-700 dark:text-slate-300", children: rental.id.slice(0, 8) })] })] }) }, rental.id));
                }) }))] }));
}
//# sourceMappingURL=MyRentalsPage.js.map