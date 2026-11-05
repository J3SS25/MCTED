import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Mail, Calendar } from 'lucide-react';
import { formatDate } from '@mcteb/shared';
const BARANGAYS = [
    { value: 'Chanarian', label: 'Chanarian' },
    { value: 'Ihubok I (Kayvaluganan)', label: 'Ihubok I (Kayvaluganan)' },
    { value: 'Ihubok II (Kaychanarianan)', label: 'Ihubok II (Kaychanarianan)' },
    { value: 'Kayhuvokan', label: 'Kayhuvokan' },
    { value: 'San Antonio', label: 'San Antonio' },
    { value: 'San Joaquin', label: 'San Joaquin' },
];
export function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        phone: user?.phone || '',
        barangay: user?.barangay || 'San Antonio',
        address: user?.address || '',
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    if (!user)
        return null;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        setSaving(true);
        try {
            await apiRequest(`/users/${user.id}/profile`, {
                method: 'PATCH',
                body: JSON.stringify(formData),
            });
            await refreshUser();
            setMessage('Profile contact details successfully updated.');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6 max-w-3xl mx-auto", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100", children: "User Account & Profile" }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1", children: "Manage your contact information and review verified municipal status." })] }), message && _jsx(Alert, { variant: "success", children: message }), error && _jsx(Alert, { variant: "error", children: error }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl bg-civic-forest text-white flex items-center justify-center font-bold text-2xl shadow-sm", children: user.full_name.charAt(0) }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "font-bold text-lg text-slate-900 dark:text-slate-100", children: user.full_name }), _jsx(Badge, { status: user.status })] }), _jsxs("p", { className: "text-xs text-slate-500 flex items-center gap-1.5", children: [_jsx(Mail, { className: "h-3.5 w-3.5" }), " ", user.email] }), _jsxs("p", { className: "text-xs text-slate-500 flex items-center gap-1.5", children: [_jsx(Calendar, { className: "h-3.5 w-3.5" }), " Registered: ", formatDate(user.created_at)] })] })] }), _jsx("div", { className: "self-end sm:self-center", children: _jsxs("span", { className: "px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300", children: ["Role: ", user.role] }) })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-6", children: [_jsx("h4", { className: "text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4", children: "Residential & Contact Details" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsx(Input, { label: "Full Name", required: true, value: formData.full_name, onChange: (e) => setFormData({ ...formData, full_name: e.target.value }) }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsx(Input, { label: "Contact Number", required: true, value: formData.phone, onChange: (e) => setFormData({ ...formData, phone: e.target.value }) }), _jsx(Select, { label: "Barangay", options: BARANGAYS, value: formData.barangay, onChange: (e) => setFormData({ ...formData, barangay: e.target.value }) })] }), _jsx(Input, { label: "Street Address", required: true, value: formData.address, onChange: (e) => setFormData({ ...formData, address: e.target.value }) }), _jsx("div", { className: "pt-2 flex justify-end", children: _jsx(Button, { type: "submit", isLoading: saving, children: "Save Changes" }) })] })] }) })] }));
}
//# sourceMappingURL=ProfilePage.js.map