import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { CreditCard, Receipt, PlusCircle } from 'lucide-react';
import { formatPHP, formatDate } from '@mcteb/shared';
const PAYMENT_METHODS = [
    { value: 'Cash', label: 'Cash (Municipal Hall Counter)' },
    { value: 'GCash', label: 'GCash' },
    { value: 'Bank Transfer', label: 'Land Bank Transfer' },
    { value: 'Municipal Treasury', label: 'Municipal Treasury Assessment' },
];
export function MyPaymentsPage() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    // Submit payment modal state
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [amountPesos, setAmountPesos] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('GCash');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const fetchPayments = async () => {
        try {
            const data = await apiRequest('/payments');
            setPayments(data);
        }
        catch (err) {
            console.error('Failed to load payments', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchPayments();
    }, []);
    const handleRecordPayment = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await apiRequest('/payments', {
                method: 'POST',
                body: JSON.stringify({
                    amount_centavos: Math.round(Number(amountPesos) * 100),
                    payment_method: paymentMethod,
                }),
            });
            setIsSubmitModalOpen(false);
            setAmountPesos('');
            await fetchPayments();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to record payment');
        }
        finally {
            setSubmitting(false);
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-8 w-48" }), _jsx(Skeleton, { className: "h-20 rounded-xl" }), _jsx(Skeleton, { className: "h-20 rounded-xl" })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100", children: "Payments & Official Receipts" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1", children: "Track rental fee payments and download municipal receipts." })] }), _jsxs(Button, { onClick: () => setIsSubmitModalOpen(true), className: "gap-2 self-start sm:self-auto", children: [_jsx(PlusCircle, { className: "h-4 w-4" }), " Record New Payment"] })] }), payments.length === 0 ? (_jsx(EmptyState, { icon: _jsx(CreditCard, { className: "h-12 w-12 text-slate-400 stroke-1" }), title: "No payments recorded", description: "You do not have any recorded rental fee transactions yet." })) : (_jsx("div", { className: "space-y-3", children: payments.map((payment) => (_jsx(Card, { children: _jsxs(CardContent, { className: "p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-mono text-xs font-semibold text-slate-700 dark:text-slate-300", children: payment.receipt_reference }), _jsx(Badge, { status: payment.status })] }), _jsxs("p", { className: "text-sm font-bold text-slate-900 dark:text-slate-100", children: [formatPHP(payment.amount_centavos), " \u2022 ", payment.payment_method] }), _jsxs("p", { className: "text-xs text-slate-500", children: ["Submitted: ", formatDate(payment.created_at), payment.verified_at && ` | Verified on ${formatDate(payment.verified_at)}`] })] }), _jsx("div", { className: "self-end sm:self-center", children: _jsxs(Button, { size: "sm", variant: "outline", className: "gap-1.5", onClick: () => setSelectedReceipt(payment), children: [_jsx(Receipt, { className: "h-4 w-4" }), " View Receipt"] }) })] }) }, payment.id))) })), _jsxs(Modal, { isOpen: isSubmitModalOpen, onClose: () => setIsSubmitModalOpen(false), title: "Record Fee Payment", children: [error && _jsx(Alert, { variant: "error", className: "mb-4", children: error }), _jsxs("form", { onSubmit: handleRecordPayment, className: "space-y-4", children: [_jsx(Input, { label: "Payment Amount (\u20B1)", type: "number", min: "1", step: "0.01", required: true, value: amountPesos, onChange: (e) => setAmountPesos(e.target.value), placeholder: "150.00" }), _jsx(Select, { label: "Payment Method", options: PAYMENT_METHODS, value: paymentMethod, onChange: (e) => setPaymentMethod(e.target.value) }), _jsx("p", { className: "text-xs text-slate-500", children: "Note: Your payment reference will be submitted to the Municipal Treasury staff for verification." }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setIsSubmitModalOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", isLoading: submitting, children: "Submit for Verification" })] })] })] }), selectedReceipt && (_jsx(OfficialReceiptModal, { isOpen: !!selectedReceipt, onClose: () => setSelectedReceipt(null), payment: selectedReceipt }))] }));
}
//# sourceMappingURL=MyPaymentsPage.js.map