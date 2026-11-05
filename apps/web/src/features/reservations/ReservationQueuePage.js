import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Check, X, CalendarCheck } from 'lucide-react';
import { formatDate } from '@mcteb/shared';
export function ReservationQueuePage() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('Pending');
    // Review modal state
    const [selectedRes, setSelectedRes] = useState(null);
    const [decision, setDecision] = useState('Approved');
    const [staffNotes, setStaffNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const fetchQueue = async () => {
        setLoading(true);
        try {
            const url = filterStatus ? `/reservations?status=${filterStatus}` : '/reservations';
            const data = await apiRequest(url);
            setReservations(data);
        }
        catch (err) {
            console.error('Failed to load reservation queue', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchQueue();
    }, [filterStatus]);
    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRes)
            return;
        setSubmitting(true);
        try {
            await apiRequest(`/reservations/${selectedRes.id}/review`, {
                method: 'PATCH',
                body: JSON.stringify({
                    decision,
                    staff_notes: staffNotes,
                }),
            });
            setMessage(`Reservation was successfully ${decision.toLowerCase()}.`);
            setSelectedRes(null);
            setStaffNotes('');
            await fetchQueue();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Review action failed');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100", children: "Municipal Reservation Queue" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1", children: "Review resident equipment requests and verify dates and inventory." })] }), _jsx("div", { className: "w-full sm:w-48", children: _jsx(Select, { label: "Filter Status", options: [
                                { value: '', label: 'All Statuses' },
                                { value: 'Pending', label: 'Pending Only' },
                                { value: 'Approved', label: 'Approved Only' },
                                { value: 'Completed', label: 'Completed' },
                                { value: 'Rejected', label: 'Rejected' },
                                { value: 'Cancelled', label: 'Cancelled' },
                            ], value: filterStatus, onChange: (e) => setFilterStatus(e.target.value) }) })] }), message && _jsx(Alert, { variant: "success", children: message }), loading ? (_jsxs("div", { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-24 rounded-xl" }), _jsx(Skeleton, { className: "h-24 rounded-xl" })] })) : reservations.length === 0 ? (_jsx(EmptyState, { icon: _jsx(CalendarCheck, { className: "h-12 w-12 text-slate-400 stroke-1" }), title: "Queue is empty", description: `No reservations found with status "${filterStatus || 'all'}"` })) : (_jsx("div", { className: "space-y-4", children: reservations.map((res) => (_jsx(Card, { children: _jsxs(CardContent, { className: "p-5 flex flex-col md:flex-row md:items-center justify-between gap-4", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "font-bold text-base text-slate-900 dark:text-slate-100", children: res.tool_name }), _jsx(Badge, { status: res.status }), _jsxs("span", { className: "text-xs text-slate-400 font-mono", children: ["ID: ", res.id.slice(0, 8)] })] }), _jsxs("p", { className: "text-sm font-medium text-slate-800 dark:text-slate-200", children: ["Borrower: ", _jsx("span", { className: "font-semibold text-civic-deep dark:text-civic-light", children: res.borrower_name }), " \u2022 Brgy. ", res.borrower_barangay, " \u2022 ", res.borrower_phone] }), _jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: ["Dates: ", _jsx("strong", { children: formatDate(res.pickup_date) }), " to ", _jsx("strong", { children: formatDate(res.return_date) }), " (", res.quantity, " unit)"] }), res.purpose && (_jsxs("p", { className: "text-xs text-slate-600 dark:text-slate-300 italic", children: ["Project Purpose: \"", res.purpose, "\""] })), res.staff_notes && (_jsxs("p", { className: "text-xs text-slate-500 bg-slate-100 dark:bg-slate-700/60 p-2 rounded", children: ["Staff Note: ", res.staff_notes] }))] }), _jsx("div", { className: "flex items-center gap-2 self-end md:self-center", children: res.status === 'Pending' && (_jsxs(_Fragment, { children: [_jsxs(Button, { size: "sm", variant: "primary", className: "gap-1.5", onClick: () => {
                                                setSelectedRes(res);
                                                setDecision('Approved');
                                            }, children: [_jsx(Check, { className: "h-4 w-4" }), " Approve"] }), _jsxs(Button, { size: "sm", variant: "danger", className: "gap-1.5", onClick: () => {
                                                setSelectedRes(res);
                                                setDecision('Rejected');
                                            }, children: [_jsx(X, { className: "h-4 w-4" }), " Reject"] })] })) })] }) }, res.id))) })), selectedRes && (_jsx(Modal, { isOpen: !!selectedRes, onClose: () => setSelectedRes(null), title: `${decision} Reservation Request`, children: _jsxs("form", { onSubmit: handleReviewSubmit, className: "space-y-4", children: [_jsxs("p", { className: "text-sm text-slate-600 dark:text-slate-300", children: ["You are about to mark this request for ", _jsx("strong", { children: selectedRes.tool_name }), " by ", _jsx("strong", { children: selectedRes.borrower_name }), " as ", _jsx(Badge, { status: decision }), "."] }), _jsx(Input, { label: "Staff Decision Notes / Reason", placeholder: decision === 'Approved' ? 'Verified ID and safety equipment' : 'Reason for rejection (e.g. maintenance conflict)', value: staffNotes, onChange: (e) => setStaffNotes(e.target.value), required: decision === 'Rejected' }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setSelectedRes(null), children: "Cancel" }), _jsxs(Button, { type: "submit", variant: decision === 'Approved' ? 'primary' : 'danger', isLoading: submitting, children: ["Confirm ", decision] })] })] }) }))] }));
}
//# sourceMappingURL=ReservationQueuePage.js.map