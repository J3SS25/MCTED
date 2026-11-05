import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { formatPHP } from '@mcteb/shared';
export function ReservationFormModal({ isOpen, onClose, tool }) {
    const navigate = useNavigate();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0];
    const [pickupDate, setPickupDate] = useState(tomorrowStr);
    const [returnDate, setReturnDate] = useState(threeDaysLaterStr);
    const [quantity, setQuantity] = useState(1);
    const [purpose, setPurpose] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    // Calculate estimated days & fee
    const days = Math.max(1, Math.ceil((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const estimatedRentalTotal = tool.rental_fee_centavos * days * quantity;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await apiRequest('/reservations', {
                method: 'POST',
                body: JSON.stringify({
                    tool_id: tool.id,
                    quantity,
                    pickup_date: pickupDate,
                    return_date: returnDate,
                    purpose,
                }),
            });
            onClose();
            navigate('/my-reservations');
        }
        catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            }
            else {
                setError('Failed to submit reservation request');
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(Modal, { isOpen: isOpen, onClose: onClose, title: `Reserve ${tool.name}`, children: [error && _jsx(Alert, { variant: "error", className: "mb-4", children: error }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Input, { label: "Pickup Date", type: "date", required: true, value: pickupDate, onChange: (e) => setPickupDate(e.target.value) }), _jsx(Input, { label: "Return Date", type: "date", required: true, value: returnDate, onChange: (e) => setReturnDate(e.target.value) })] }), _jsx(Input, { label: "Quantity Needed", type: "number", min: "1", max: tool.available_quantity, required: true, value: quantity, onChange: (e) => setQuantity(Number(e.target.value)), helperText: `Maximum available right now: ${tool.available_quantity}` }), _jsx(Input, { label: "Intended Project / Purpose", required: true, placeholder: "e.g. Garden irrigation / home repair / boat maintenance", value: purpose, onChange: (e) => setPurpose(e.target.value) }), _jsxs("div", { className: "p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs space-y-1.5 border border-slate-200 dark:border-slate-800", children: [_jsxs("div", { className: "flex justify-between text-slate-600 dark:text-slate-400", children: [_jsx("span", { children: "Duration:" }), _jsxs("span", { className: "font-semibold text-slate-800 dark:text-slate-200", children: [days, " day(s)"] })] }), _jsxs("div", { className: "flex justify-between text-slate-600 dark:text-slate-400", children: [_jsx("span", { children: "Estimated Rental Fee:" }), _jsx("span", { className: "font-semibold text-slate-800 dark:text-slate-200", children: formatPHP(estimatedRentalTotal) })] }), _jsxs("div", { className: "flex justify-between text-slate-600 dark:text-slate-400", children: [_jsx("span", { children: "Refundable Deposit:" }), _jsx("span", { className: "font-semibold text-slate-800 dark:text-slate-200", children: formatPHP(tool.deposit_fee_centavos * quantity) })] })] }), _jsxs("div", { className: "pt-2 flex justify-end gap-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, disabled: loading, children: "Cancel" }), _jsx(Button, { type: "submit", isLoading: loading, children: "Submit Request" })] })] })] }));
}
//# sourceMappingURL=ReservationFormModal.js.map