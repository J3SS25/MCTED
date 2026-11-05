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
import { MaintenanceReportModal } from './MaintenanceReportModal';
import { ClipboardList, PlusCircle } from 'lucide-react';
import { formatPHP, formatDate } from '@mcteb/shared';
const STATUS_OPTIONS = [
    { value: 'Reported', label: 'Reported' },
    { value: 'Scheduled', label: 'Scheduled' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed (Repaired)' },
    { value: 'Decommissioned', label: 'Decommissioned (Scrapped)' },
];
export function MaintenancePage() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    // Update modal state
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [newStatus, setNewStatus] = useState('Completed');
    const [actualCostPesos, setActualCostPesos] = useState(0);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [returnToService, setReturnToService] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const fetchRecords = async () => {
        setLoading(true);
        try {
            const data = await apiRequest('/maintenance');
            setRecords(data);
        }
        catch (err) {
            console.error('Failed to load maintenance records', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchRecords();
    }, []);
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRecord)
            return;
        setSubmitting(true);
        try {
            await apiRequest(`/maintenance/${selectedRecord.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: newStatus,
                    actual_cost_centavos: Math.round(actualCostPesos * 100),
                    resolution_notes: resolutionNotes,
                    return_to_service: returnToService,
                }),
            });
            setMessage(`Maintenance ticket for ${selectedRecord.tool_name} updated.`);
            setSelectedRecord(null);
            await fetchRecords();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Update failed');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100", children: "Equipment Maintenance & Repair Board" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1", children: "Track tool defects, repair schedules, parts costs, and return-to-service decisions." })] }), _jsxs(Button, { onClick: () => setIsReportModalOpen(true), className: "gap-2 self-start sm:self-auto", children: [_jsx(PlusCircle, { className: "h-4 w-4" }), " Report Tool Defect"] })] }), message && _jsx(Alert, { variant: "success", children: message }), loading ? (_jsxs("div", { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-24 rounded-xl" }), _jsx(Skeleton, { className: "h-24 rounded-xl" })] })) : records.length === 0 ? (_jsx(EmptyState, { icon: _jsx(ClipboardList, { className: "h-12 w-12 text-slate-400 stroke-1" }), title: "No open maintenance tickets", description: "All municipal tools are in active working condition." })) : (_jsx("div", { className: "space-y-3", children: records.map((m) => (_jsx(Card, { children: _jsxs(CardContent, { className: "p-4 flex flex-col md:flex-row md:items-center justify-between gap-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h4", { className: "font-bold text-sm text-slate-900 dark:text-slate-100", children: m.tool_name }), _jsx(Badge, { status: m.severity }), _jsx(Badge, { status: m.status })] }), _jsxs("p", { className: "text-xs text-slate-700 dark:text-slate-300", children: [_jsx("strong", { children: "Issue:" }), " ", m.issue_description] }), _jsxs("p", { className: "text-xs text-slate-500", children: ["Reported by: ", m.reporter_name, " \u2022 Scheduled: ", m.scheduled_date ? formatDate(m.scheduled_date) : 'Unscheduled', m.technician_name && ` • Technician: ${m.technician_name}`] }), m.resolution_notes && (_jsxs("p", { className: "text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded", children: ["Resolution: ", m.resolution_notes, " (Cost: ", formatPHP(m.actual_cost_centavos), ")"] }))] }), _jsx("div", { className: "self-end md:self-center", children: m.status !== 'Completed' && m.status !== 'Decommissioned' && (_jsx(Button, { size: "sm", variant: "secondary", onClick: () => {
                                        setSelectedRecord(m);
                                        setNewStatus('Completed');
                                        setActualCostPesos(m.estimated_cost_centavos / 100);
                                    }, children: "Update / Resolve Ticket" })) })] }) }, m.id))) })), _jsx(MaintenanceReportModal, { isOpen: isReportModalOpen, onClose: () => setIsReportModalOpen(false), onSuccess: fetchRecords }), selectedRecord && (_jsx(Modal, { isOpen: !!selectedRecord, onClose: () => setSelectedRecord(null), title: `Resolve Ticket: ${selectedRecord.tool_name}`, children: _jsxs("form", { onSubmit: handleUpdateSubmit, className: "space-y-4", children: [_jsx(Select, { label: "New Maintenance Status", options: STATUS_OPTIONS, value: newStatus, onChange: (e) => setNewStatus(e.target.value) }), _jsx(Input, { label: "Actual Repair / Parts Cost (\u20B1)", type: "number", min: "0", value: actualCostPesos, onChange: (e) => setActualCostPesos(Number(e.target.value)) }), _jsx(Input, { label: "Resolution Notes", placeholder: "e.g. Spark plug replaced, carburetor ultrasonically cleaned, verified running", value: resolutionNotes, onChange: (e) => setResolutionNotes(e.target.value), required: true }), newStatus === 'Completed' && (_jsxs("div", { className: "flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800", children: [_jsx("input", { type: "checkbox", id: "returnToService", checked: returnToService, onChange: (e) => setReturnToService(e.target.checked), className: "rounded text-civic-forest focus:ring-civic-accent h-4 w-4" }), _jsx("label", { htmlFor: "returnToService", className: "text-xs font-semibold text-emerald-900 dark:text-emerald-200", children: "Return item to service (Restore to \"Available\" status in Catalog)" })] })), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setSelectedRecord(null), children: "Cancel" }), _jsx(Button, { type: "submit", isLoading: submitting, children: "Save Updates" })] })] }) }))] }));
}
//# sourceMappingURL=MaintenancePage.js.map