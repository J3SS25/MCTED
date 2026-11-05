import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ReturnInspectionModal } from './ReturnInspectionModal';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatDate } from '@mcteb/shared';
export function RentalDeskPage() {
    const [rentals, setRentals] = useState([]);
    const [approvedReservations, setApprovedReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inspectRental, setInspectRental] = useState(null);
    const [checkoutLoading, setCheckoutLoading] = useState(null);
    const fetchData = async () => {
        setLoading(true);
        try {
            const [rentalsData, resData] = await Promise.all([
                apiRequest('/rentals'),
                apiRequest('/reservations?status=Approved'),
            ]);
            setRentals(rentalsData);
            setApprovedReservations(resData);
        }
        catch (err) {
            console.error('Failed to load rental desk data', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);
    const handleHandoverCheckout = async (reservation) => {
        if (!confirm(`Release ${reservation.quantity} unit(s) of "${reservation.tool_name}" to ${reservation.borrower_name}?`)) {
            return;
        }
        setCheckoutLoading(reservation.id);
        try {
            await apiRequest('/rentals/checkout', {
                method: 'POST',
                body: JSON.stringify({
                    reservation_id: reservation.id,
                    user_id: reservation.user_id,
                    tool_id: reservation.tool_id,
                    quantity: reservation.quantity,
                    due_date: reservation.return_date,
                    initial_condition: 'Good',
                    inspection_notes: `Released pursuant to approved reservation ${reservation.id.slice(0, 8)}`,
                }),
            });
            await fetchData();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Checkout failed');
        }
        finally {
            setCheckoutLoading(null);
        }
    };
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100", children: "Municipal Tool Rental Desk" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1", children: "Coordinate equipment pickup handovers and process return inspections." })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ArrowDownLeft, { className: "h-5 w-5 text-civic-accent" }), _jsxs("h3", { className: "text-base font-bold text-slate-900 dark:text-slate-100", children: ["Handovers Ready for Pickup (", approvedReservations.length, ")"] })] }), approvedReservations.length === 0 ? (_jsx(Card, { children: _jsx(CardContent, { className: "p-4 text-center text-xs text-slate-500", children: "No approved reservations currently awaiting tool handover pickup." }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: approvedReservations.map((res) => (_jsx(Card, { className: "border-l-4 border-l-civic-forest", children: _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-bold text-sm text-slate-900 dark:text-slate-100", children: res.tool_name }), _jsxs("p", { className: "text-xs text-slate-600 dark:text-slate-400", children: ["Borrower: ", _jsx("strong", { children: res.borrower_name }), " (Brgy. ", res.borrower_barangay, ")"] })] }), _jsx(Badge, { status: "Approved" })] }), _jsxs("div", { className: "text-xs text-slate-500 space-y-0.5", children: [_jsxs("p", { children: ["Contact: ", res.borrower_phone] }), _jsxs("p", { children: ["Expected Due: ", formatDate(res.return_date)] })] }), _jsx(Button, { size: "sm", className: "w-full", isLoading: checkoutLoading === res.id, onClick: () => handleHandoverCheckout(res), children: "Release & Complete Handover" })] }) }, res.id))) }))] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ArrowUpRight, { className: "h-5 w-5 text-blue-500" }), _jsxs("h3", { className: "text-base font-bold text-slate-900 dark:text-slate-100", children: ["Active Loans & Return Inspection (", rentals.filter((r) => r.status === 'Borrowed').length, " Active)"] })] }), rentals.length === 0 ? (_jsx(EmptyState, { title: "No loan records", description: "No current active equipment loans on the municipal ledger." })) : (_jsx("div", { className: "space-y-3", children: rentals.map((rental) => (_jsx(Card, { children: _jsxs(CardContent, { className: "p-4 flex flex-col md:flex-row md:items-center justify-between gap-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h4", { className: "font-bold text-sm text-slate-900 dark:text-slate-100", children: rental.tool_name }), _jsx(Badge, { status: rental.status })] }), _jsxs("p", { className: "text-xs text-slate-600 dark:text-slate-400", children: ["Borrower: ", _jsx("strong", { children: rental.borrower_name }), " \u2022 Due: ", _jsx("strong", { children: formatDate(rental.due_date) })] }), _jsxs("p", { className: "text-xs text-slate-500", children: ["Condition at Release: ", rental.initial_condition, rental.returned_condition && ` | Returned: ${rental.returned_condition}`] })] }), _jsx("div", { className: "self-end md:self-center", children: rental.status === 'Borrowed' && (_jsx(Button, { size: "sm", variant: "secondary", onClick: () => setInspectRental(rental), children: "Inspect & Process Return" })) })] }) }, rental.id))) }))] }), inspectRental && (_jsx(ReturnInspectionModal, { isOpen: !!inspectRental, onClose: () => setInspectRental(null), rental: inspectRental, onSuccess: fetchData }))] }));
}
//# sourceMappingURL=RentalDeskPage.js.map