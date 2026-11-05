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
import { OfficialReceiptModal } from './OfficialReceiptModal';
import { CreditCard, Check, X, Receipt } from 'lucide-react';
import { formatPHP, formatDate } from '@mcteb/shared';
export function PaymentVerificationPage() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('Pending');
    // Verification modal state
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [decisionStatus, setDecisionStatus] = useState('Paid');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    // Receipt modal state
    const [viewReceipt, setViewReceipt] = useState(null);
    const fetchPayments = async () => {
        setLoading(true);
        try {
            const url = filterStatus ? `/payments?status=${filterStatus}` : '/payments';
            const data = await apiRequest(url);
            setPayments(data);
        }
        catch (err) {
            console.error('Failed to load payments queue', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchPayments();
    }, [filterStatus]);
    const handleVerifySubmit = async (e) => {
        e.preventDefault();
        if (!selectedPayment)
            return;
        setSubmitting(true);
        try {
            await apiRequest(`/payments/${selectedPayment.id}/verify`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: decisionStatus,
                    notes,
                }),
            });
            setMessage(`Payment ${selectedPayment.receipt_reference} marked as ${decisionStatus}.`);
            setSelectedPayment(null);
            setNotes('');
            await fetchPayments();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Verification failed');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100", children: "Municipal Payment Verification Queue" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1", children: "Verify resident payments against municipal treasury records or banking statements." })] }), _jsx("div", { className: "w-full sm:w-48", children: _jsx(Select, { label: "Filter Status", options: [
                                { value: '', label: 'All Statuses' },
                                { value: 'Pending', label: 'Pending Only' },
                                { value: 'Paid', label: 'Verified Paid' },
                                { value: 'Failed', label: 'Failed' },
                                { value: 'Refunded', label: 'Refunded' },
                            ], value: filterStatus, onChange: (e) => setFilterStatus(e.target.value) }) })] }), message && _jsx(Alert, { variant: "success", children: message }), loading ? (_jsxs("div", { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-24 rounded-xl" }), _jsx(Skeleton, { className: "h-24 rounded-xl" })] })) : payments.length === 0 ? (_jsx(EmptyState, { icon: _jsx(CreditCard, { className: "h-12 w-12 text-slate-400 stroke-1" }), title: "No payments in queue", description: `No payments currently matching status "${filterStatus || 'all'}".` })) : (_jsx("div", { className: "space-y-3", children: payments.map((p) => (_jsx(Card, { children: _jsxs(CardContent, { className: "p-4 flex flex-col md:flex-row md:items-center justify-between gap-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-mono text-xs font-bold text-slate-800 dark:text-slate-200", children: p.receipt_reference }), _jsx(Badge, { status: p.status })] }), _jsxs("p", { className: "text-sm font-semibold text-slate-900 dark:text-slate-100", children: ["Payer: ", p.payer_name, " (Brgy. ", p.payer_barangay, ") \u2022", ' ', _jsx("span", { className: "text-civic-forest dark:text-civic-light font-bold", children: formatPHP(p.amount_centavos) })] }), _jsxs("p", { className: "text-xs text-slate-500", children: ["Method: ", p.payment_method, " \u2022 Recorded on ", formatDate(p.created_at)] })] }), _jsxs("div", { className: "flex items-center gap-2 self-end md:self-center", children: [_jsxs(Button, { size: "sm", variant: "ghost", onClick: () => setViewReceipt(p), className: "gap-1", children: [_jsx(Receipt, { className: "h-4 w-4" }), " Receipt"] }), p.status === 'Pending' && (_jsxs(_Fragment, { children: [_jsxs(Button, { size: "sm", variant: "primary", className: "gap-1.5", onClick: () => {
                                                    setSelectedPayment(p);
                                                    setDecisionStatus('Paid');
                                                }, children: [_jsx(Check, { className: "h-4 w-4" }), " Verify Paid"] }), _jsxs(Button, { size: "sm", variant: "danger", className: "gap-1.5", onClick: () => {
                                                    setSelectedPayment(p);
                                                    setDecisionStatus('Failed');
                                                }, children: [_jsx(X, { className: "h-4 w-4" }), " Decline"] })] }))] })] }) }, p.id))) })), selectedPayment && (_jsx(Modal, { isOpen: !!selectedPayment, onClose: () => setSelectedPayment(null), title: `Verify Payment: ${selectedPayment.receipt_reference}`, children: _jsxs("form", { onSubmit: handleVerifySubmit, className: "space-y-4", children: [_jsxs("p", { className: "text-sm text-slate-600 dark:text-slate-300", children: ["Mark payment of ", _jsx("strong", { children: formatPHP(selectedPayment.amount_centavos) }), " by", ' ', _jsx("strong", { children: selectedPayment.payer_name }), " as ", _jsx(Badge, { status: decisionStatus }), "."] }), _jsx(Input, { label: "Staff Notes", placeholder: "Treasury OR Number / Bank Ref match confirmed", value: notes, onChange: (e) => setNotes(e.target.value) }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setSelectedPayment(null), children: "Cancel" }), _jsx(Button, { type: "submit", variant: decisionStatus === 'Paid' ? 'primary' : 'danger', isLoading: submitting, children: "Confirm Verification" })] })] }) })), viewReceipt && (_jsx(OfficialReceiptModal, { isOpen: !!viewReceipt, onClose: () => setViewReceipt(null), payment: viewReceipt }))] }));
}
//# sourceMappingURL=PaymentVerificationPage.js.map