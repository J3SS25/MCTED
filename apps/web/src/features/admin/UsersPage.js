import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Skeleton';
import { ShieldAlert } from 'lucide-react';
import { formatDate } from '@mcteb/shared';
const ROLES = [
    { value: 'Borrower', label: 'Borrower (Resident)' },
    { value: 'Municipal Staff', label: 'Municipal Staff' },
    { value: 'Administrator', label: 'Administrator' },
];
const STATUSES = [
    { value: 'Active', label: 'Active' },
    { value: 'Pending Verification', label: 'Pending Verification' },
    { value: 'Suspended', label: 'Suspended' },
];
export function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    // Edit user state
    const [targetUser, setTargetUser] = useState(null);
    const [newRole, setNewRole] = useState('Borrower');
    const [newStatus, setNewStatus] = useState('Active');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await apiRequest('/users');
            setUsers(data);
        }
        catch (err) {
            console.error('Failed to load users', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchUsers();
    }, []);
    const openEditModal = (u) => {
        setTargetUser(u);
        setNewRole(u.role);
        setNewStatus(u.status);
        setReason('');
        setError(null);
    };
    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!targetUser)
            return;
        setError(null);
        setSubmitting(true);
        try {
            // If role changed
            if (newRole !== targetUser.role) {
                await apiRequest(`/users/${targetUser.id}/role`, {
                    method: 'PATCH',
                    body: JSON.stringify({ role: newRole, reason }),
                });
            }
            // If status changed
            if (newStatus !== targetUser.status) {
                await apiRequest(`/users/${targetUser.id}/status`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status: newStatus, reason }),
                });
            }
            setMessage(`Account for ${targetUser.full_name} successfully updated.`);
            setTargetUser(null);
            await fetchUsers();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update user');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100", children: "User & Account Oversight" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1", children: "Administrator management of municipal account roles, statuses, and permissions." })] }), message && _jsx(Alert, { variant: "success", children: message }), loading ? (_jsxs("div", { className: "space-y-3", children: [_jsx(Skeleton, { className: "h-12 w-full rounded-xl" }), _jsx(Skeleton, { className: "h-16 w-full rounded-xl" }), _jsx(Skeleton, { className: "h-16 w-full rounded-xl" })] })) : (_jsx("div", { className: "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-left text-xs", children: [_jsx("thead", { className: "bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-700 dark:text-slate-300", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3", children: "Resident / Account" }), _jsx("th", { className: "px-4 py-3", children: "Barangay" }), _jsx("th", { className: "px-4 py-3", children: "Role" }), _jsx("th", { className: "px-4 py-3", children: "Status" }), _jsx("th", { className: "px-4 py-3", children: "Registered" }), _jsx("th", { className: "px-4 py-3 text-right", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-700/60", children: users.map((u) => {
                                    const isSelf = currentUser?.id === u.id;
                                    return (_jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-700/30", children: [_jsxs("td", { className: "px-4 py-3", children: [_jsxs("div", { className: "font-semibold text-slate-900 dark:text-slate-100", children: [u.full_name, " ", isSelf && _jsx("span", { className: "text-[10px] text-emerald-600 font-bold", children: "(You)" })] }), _jsxs("div", { className: "text-[11px] text-slate-500", children: [u.email, " \u2022 ", u.phone] })] }), _jsx("td", { className: "px-4 py-3 text-slate-600 dark:text-slate-400", children: u.barangay }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: "font-semibold text-slate-800 dark:text-slate-200", children: u.role }) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Badge, { status: u.status }) }), _jsx("td", { className: "px-4 py-3 text-slate-500", children: formatDate(u.created_at) }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsx(Button, { size: "sm", variant: "outline", onClick: () => openEditModal(u), children: "Manage" }) })] }, u.id));
                                }) })] }) }) })), targetUser && (_jsxs(Modal, { isOpen: !!targetUser, onClose: () => setTargetUser(null), title: `Manage Account: ${targetUser.full_name}`, children: [error && _jsx(Alert, { variant: "error", className: "mb-4", children: error }), _jsxs("form", { onSubmit: handleUpdate, className: "space-y-4", children: [_jsx(Select, { label: "Assigned System Role", options: ROLES, value: newRole, onChange: (e) => setNewRole(e.target.value) }), _jsx(Select, { label: "Account Status", options: STATUSES, value: newStatus, onChange: (e) => setNewStatus(e.target.value) }), _jsx(Input, { label: "Administrative Reason (Required for Audit Trail)", placeholder: "e.g. Verified barangay residency ID; Staff appointment", value: reason, onChange: (e) => setReason(e.target.value), required: true }), _jsxs("div", { className: "p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-xs text-amber-800 dark:text-amber-300", children: [_jsx(ShieldAlert, { className: "h-4 w-4 inline mr-1" }), "Administrative safeguards prohibit suspending your own active account or demoting the sole remaining Administrator."] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setTargetUser(null), children: "Cancel" }), _jsx(Button, { type: "submit", isLoading: submitting, children: "Save Account Changes" })] })] })] }))] }));
}
//# sourceMappingURL=UsersPage.js.map