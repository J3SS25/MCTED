import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Select, Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
export function SubmitFeedbackModal({ isOpen, onClose, onSuccess }) {
    const [tools, setTools] = useState([]);
    const [toolId, setToolId] = useState('');
    const [overallRating, setOverallRating] = useState(5);
    const [toolConditionRating, setToolConditionRating] = useState(5);
    const [serviceRating, setServiceRating] = useState(5);
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        async function loadTools() {
            try {
                const res = await apiRequest('/tools?limit=100');
                setTools(res.items);
                if (res.items.length > 0 && !toolId) {
                    setToolId(res.items[0].id);
                }
            }
            catch (err) {
                console.error('Failed to load tools for feedback', err);
            }
        }
        if (isOpen) {
            loadTools();
        }
    }, [isOpen]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await apiRequest('/feedback', {
                method: 'POST',
                body: JSON.stringify({
                    tool_id: toolId,
                    overall_rating: Number(overallRating),
                    tool_condition_rating: Number(toolConditionRating),
                    service_rating: Number(serviceRating),
                    comments,
                }),
            });
            onSuccess();
            onClose();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit feedback');
        }
        finally {
            setSubmitting(false);
        }
    };
    const ratingOptions = [
        { value: '5', label: '5 Stars - Excellent' },
        { value: '4', label: '4 Stars - Very Good' },
        { value: '3', label: '3 Stars - Satisfactory' },
        { value: '2', label: '2 Stars - Needs Improvement' },
        { value: '1', label: '1 Star - Poor' },
    ];
    return (_jsxs(Modal, { isOpen: isOpen, onClose: onClose, title: "Share Community Tool Experience", children: [error && _jsx(Alert, { variant: "error", className: "mb-4", children: error }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsx(Select, { label: "Tool Loaned", options: tools.map((t) => ({ value: t.id, label: t.name })), value: toolId, onChange: (e) => setToolId(e.target.value) }), _jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsx(Select, { label: "Overall Experience", options: ratingOptions, value: overallRating.toString(), onChange: (e) => setOverallRating(Number(e.target.value)) }), _jsx(Select, { label: "Tool Condition", options: ratingOptions, value: toolConditionRating.toString(), onChange: (e) => setToolConditionRating(Number(e.target.value)) }), _jsx(Select, { label: "Staff Service", options: ratingOptions, value: serviceRating.toString(), onChange: (e) => setServiceRating(Number(e.target.value)) })] }), _jsx(Input, { label: "Your Feedback / Comments", required: true, placeholder: "How did the tool perform on your project? Any advice for fellow residents?", value: comments, onChange: (e) => setComments(e.target.value) }), _jsx("p", { className: "text-xs text-slate-500", children: "Your feedback will be publicly visible to help fellow residents, with your last name abbreviated for privacy." }), _jsxs("div", { className: "pt-2 flex justify-end gap-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { type: "submit", isLoading: submitting, children: "Post Review" })] })] })] }));
}
//# sourceMappingURL=SubmitFeedbackModal.js.map