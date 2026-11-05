import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
const CATEGORIES = [
    { value: 'Agriculture', label: 'Agriculture' },
    { value: 'Fishing', label: 'Fishing' },
    { value: 'Carpentry', label: 'Carpentry' },
    { value: 'Construction', label: 'Construction' },
    { value: 'Electrical', label: 'Electrical' },
    { value: 'Emergency Response', label: 'Emergency Response' },
];
const AVAILABILITY_STATUSES = [
    { value: 'Available', label: 'Available' },
    { value: 'Reserved', label: 'Reserved' },
    { value: 'Borrowed', label: 'Borrowed' },
    { value: 'Returned', label: 'Returned' },
    { value: 'Maintenance', label: 'Maintenance' },
    { value: 'Damaged', label: 'Damaged' },
    { value: 'Archived', label: 'Archived' },
];
const CONDITION_STATUSES = [
    { value: 'Excellent', label: 'Excellent' },
    { value: 'Good', label: 'Good' },
    { value: 'Fair', label: 'Fair' },
    { value: 'Needs Repair', label: 'Needs Repair' },
    { value: 'Under Maintenance', label: 'Under Maintenance' },
];
export function ToolFormModal({ isOpen, onClose, tool, onSuccess }) {
    const isEditing = !!tool;
    const [formData, setFormData] = useState({
        name: '',
        category: 'Agriculture',
        description: '',
        specifications: '',
        rentalFeePesos: 50,
        depositFeePesos: 200,
        totalQuantity: 1,
        serialNumber: '',
        availabilityStatus: 'Available',
        conditionStatus: 'Good',
    });
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => {
        if (tool) {
            setFormData({
                name: tool.name,
                category: tool.category,
                description: tool.description,
                specifications: tool.specifications || '',
                rentalFeePesos: tool.rental_fee_centavos / 100,
                depositFeePesos: tool.deposit_fee_centavos / 100,
                totalQuantity: tool.total_quantity,
                serialNumber: tool.serial_number || '',
                availabilityStatus: tool.availability_status,
                conditionStatus: tool.condition_status,
            });
        }
        else {
            setFormData({
                name: '',
                category: 'Agriculture',
                description: '',
                specifications: '',
                rentalFeePesos: 50,
                depositFeePesos: 200,
                totalQuantity: 1,
                serialNumber: '',
                availabilityStatus: 'Available',
                conditionStatus: 'Good',
            });
        }
    }, [tool, isOpen]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const payload = {
                name: formData.name,
                category: formData.category,
                description: formData.description,
                specifications: formData.specifications || undefined,
                rental_fee_centavos: Math.round(formData.rentalFeePesos * 100),
                deposit_fee_centavos: Math.round(formData.depositFeePesos * 100),
                total_quantity: Number(formData.totalQuantity),
                serial_number: formData.serialNumber || undefined,
                availability_status: formData.availabilityStatus,
                condition_status: formData.conditionStatus,
            };
            if (isEditing && tool) {
                await apiRequest(`/tools/${tool.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                });
            }
            else {
                await apiRequest('/tools', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
            }
            onSuccess();
            onClose();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Operation failed');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsxs(Modal, { isOpen: isOpen, onClose: onClose, title: isEditing ? `Edit Equipment: ${tool.name}` : 'Add New Equipment to Catalog', maxWidth: "lg", children: [error && _jsx(Alert, { variant: "error", className: "mb-4", children: error }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsx(Input, { label: "Equipment Name", required: true, value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), placeholder: "e.g. Inverter Silent Generator 3.5 kVA" }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Select, { label: "Category", options: CATEGORIES, value: formData.category, onChange: (e) => setFormData({ ...formData, category: e.target.value }) }), _jsx(Input, { label: "Serial Number / Asset Tag", value: formData.serialNumber, onChange: (e) => setFormData({ ...formData, serialNumber: e.target.value }), placeholder: "MCTEB-EQP-001" })] }), _jsx(Input, { label: "Description", required: true, value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), placeholder: "Purpose, power specs, application guidelines" }), _jsx(Input, { label: "Technical Specifications", value: formData.specifications, onChange: (e) => setFormData({ ...formData, specifications: e.target.value }), placeholder: "Dimensions, voltage, accessories included" }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsx(Input, { label: "Rental Fee / Day (\u20B1)", type: "number", min: "0", required: true, value: formData.rentalFeePesos, onChange: (e) => setFormData({ ...formData, rentalFeePesos: Number(e.target.value) }) }), _jsx(Input, { label: "Deposit (\u20B1)", type: "number", min: "0", required: true, value: formData.depositFeePesos, onChange: (e) => setFormData({ ...formData, depositFeePesos: Number(e.target.value) }) }), _jsx(Input, { label: "Total Quantity", type: "number", min: "1", required: true, value: formData.totalQuantity, onChange: (e) => setFormData({ ...formData, totalQuantity: Number(e.target.value) }) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(Select, { label: "Availability Status", options: AVAILABILITY_STATUSES, value: formData.availabilityStatus, onChange: (e) => setFormData({ ...formData, availabilityStatus: e.target.value }) }), _jsx(Select, { label: "Condition Status", options: CONDITION_STATUSES, value: formData.conditionStatus, onChange: (e) => setFormData({ ...formData, conditionStatus: e.target.value }) })] }), _jsxs("div", { className: "pt-2 flex justify-end gap-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { type: "submit", isLoading: submitting, children: isEditing ? 'Save Changes' : 'Create Equipment Entry' })] })] })] }));
}
//# sourceMappingURL=ToolFormModal.js.map