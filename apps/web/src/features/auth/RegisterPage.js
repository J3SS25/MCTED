import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Card, CardContent } from '../../components/ui/Card';
import { Wrench } from 'lucide-react';
const BARANGAYS = [
    { value: 'Chanarian', label: 'Chanarian' },
    { value: 'Ihubok I (Kayvaluganan)', label: 'Ihubok I (Kayvaluganan)' },
    { value: 'Ihubok II (Kaychanarianan)', label: 'Ihubok II (Kaychanarianan)' },
    { value: 'Kayhuvokan', label: 'Kayhuvokan' },
    { value: 'San Antonio', label: 'San Antonio' },
    { value: 'San Joaquin', label: 'San Joaquin' },
];
export function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        birth_date: '1995-01-01',
        barangay: 'San Antonio',
        address: '',
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await register(formData);
            navigate('/dashboard', { replace: true });
        }
        catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            }
            else {
                setError('Registration failed. Please check your information.');
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "sm:mx-auto sm:w-full sm:max-w-lg text-center mb-6", children: [_jsx("div", { className: "inline-flex p-3 bg-civic-forest text-white rounded-xl shadow-md mb-3", children: _jsx(Wrench, { className: "h-7 w-7 text-civic-light" }) }), _jsx("h2", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100", children: "Register Borrower Account" }), _jsx("p", { className: "mt-1 text-sm text-slate-600 dark:text-slate-400", children: "Municipality of Basco, Batanes \u2014 Residents must be at least 18 years old." })] }), _jsx("div", { className: "sm:mx-auto sm:w-full sm:max-w-lg", children: _jsx(Card, { children: _jsxs(CardContent, { children: [error && _jsx(Alert, { variant: "error", className: "mb-4", children: error }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsx(Input, { label: "Full Name", required: true, value: formData.full_name, onChange: (e) => setFormData({ ...formData, full_name: e.target.value }), placeholder: "Juan V. Dela Cruz" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsx(Input, { label: "Email Address", type: "email", required: true, value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), placeholder: "juan@example.com" }), _jsx(Input, { label: "Contact Phone", type: "tel", required: true, value: formData.phone, onChange: (e) => setFormData({ ...formData, phone: e.target.value }), placeholder: "0917-000-0000" })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsx(Input, { label: "Birth Date", type: "date", required: true, value: formData.birth_date, onChange: (e) => setFormData({ ...formData, birth_date: e.target.value }), helperText: "Minimum 18 years old required" }), _jsx(Select, { label: "Barangay (Basco)", options: BARANGAYS, value: formData.barangay, onChange: (e) => setFormData({ ...formData, barangay: e.target.value }) })] }), _jsx(Input, { label: "Residential Street Address", required: true, value: formData.address, onChange: (e) => setFormData({ ...formData, address: e.target.value }), placeholder: "National Road / Sitio Disong" }), _jsx(Input, { label: "Password (min. 8 characters)", type: "password", required: true, value: formData.password, onChange: (e) => setFormData({ ...formData, password: e.target.value }), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), _jsx("div", { className: "pt-2", children: _jsx(Button, { type: "submit", isLoading: isLoading, className: "w-full", children: "Create Account" }) })] }), _jsx("div", { className: "mt-6 border-t border-slate-100 dark:border-slate-700/60 pt-4 text-center", children: _jsxs("p", { className: "text-xs text-slate-600 dark:text-slate-400", children: ["Already registered?", ' ', _jsx(Link, { to: "/login", className: "font-semibold text-civic-deep dark:text-civic-light hover:underline", children: "Sign in here" })] }) })] }) }) })] }));
}
//# sourceMappingURL=RegisterPage.js.map