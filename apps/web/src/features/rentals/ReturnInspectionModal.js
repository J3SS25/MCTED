import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Select, Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
const CONDITION_OPTIONS = [
    { value: 'Excellent', label: 'Excellent - Like new' },
    { value: 'Good', label: 'Good - Normal wear and tear' },
    { value: 'Fair', label: 'Fair - Heavy usage signs' },
    { value: 'Needs Repair', label: 'Needs Repair - Damaged components' },
    { value: 'Under Maintenance', label: 'Under Maintenance - Broken' },
];
export function ReturnInspectionModal({ isOpen, onClose, rental, onSuccess }) {
    const [returnedCondition, setReturnedCondition] = useState('Good');
    const [inspectionNotes, setInspectionNotes] = useState('');
    const [damagePenaltyPesos, setDamagePenaltyPesos] = useState(0);
    const [overduePenaltyPesos, setOverduePenaltyPesos] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await apiRequest(`/rentals/${rental.id}/return`, {
                method: 'POST',
                body: JSON.stringify({
                    returned_condition: returnedCondition,
                    inspection_notes: inspectionNotes,
                    overdue_penalty_centavos: Math.round(overduePenaltyPesos * 100),
                    damage_penalty_centavos: Math.round(damagePenaltyPesos * 100),
                }),
            });
            onSuccess();
            onClose();
        }
        catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            }
            else {
                setError('Failed to process tool return');
            }
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsxs(Modal, { isOpen: isOpen, onClose: onClose, title: `Inspect Return: ${rental?.tool_name}`, children: [error && _jsx(Alert, { variant: "error", className: "mb-4", children: error }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("p", { className: "text-sm text-slate-600 dark:text-slate-300", children: ["Borrower: ", _jsx("strong", { children: rental?.borrower_name }), " \u2022 Initial condition was", ' ', _jsx("strong", { children: rental?.initial_condition }), "."] }), _jsx(Select, { label: "Returned Equipment Condition", options: CONDITION_OPTIONS, value: returnedCondition, onChange: (e) => setReturnedCondition(e.target.value) }), _jsx(Input, { label: "Inspection Remarks", placeholder: "Cleaned, blade inspected, cables untangled", value: inspectionNotes, onChange: (e) => setInspectionNotes(e.target.value) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Input, { label: "Overdue Penalty (\u20B1)", type: "number", min: "0", step: "1", value: overduePenaltyPesos, onChange: (e) => setOverduePenaltyPesos(Number(e.target.value)) }), _jsx(Input, { label: "Damage Penalty (\u20B1)", type: "number", min: "0", step: "1", value: damagePenaltyPesos, onChange: (e) => setDamagePenaltyPesos(Number(e.target.value)) })] }), _jsxs("div", { className: "pt-2 flex justify-end gap-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { type: "submit", isLoading: submitting, children: "Accept Return & Update Inventory" })] })] })] }));
}
//# sourceMappingURL=ReturnInspectionModal.js.map