import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Card, CardContent } from '../../components/ui/Card';
import { Wrench } from 'lucide-react';
export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/dashboard';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await login({ email, password });
            navigate(from, { replace: true });
        }
        catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            }
            else {
                setError('Login failed. Please verify your credentials.');
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "sm:mx-auto sm:w-full sm:max-w-md text-center mb-6", children: [_jsx("div", { className: "inline-flex p-3 bg-civic-forest text-white rounded-xl shadow-md mb-3", children: _jsx(Wrench, { className: "h-7 w-7 text-civic-light" }) }), _jsx("h2", { className: "text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100", children: "Sign In to MCTEB" }), _jsx("p", { className: "mt-1 text-sm text-slate-600 dark:text-slate-400", children: "Municipal Community Tool & Equipment Bank \u2014 Basco, Batanes" })] }), _jsx("div", { className: "sm:mx-auto sm:w-full sm:max-w-md", children: _jsx(Card, { children: _jsxs(CardContent, { children: [error && _jsx(Alert, { variant: "error", className: "mb-4", children: error }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsx(Input, { label: "Email Address", type: "email", autoComplete: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "juan.d@basco.net" }), _jsx(Input, { label: "Password", type: "password", autoComplete: "current-password", required: true, value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), _jsx("div", { className: "pt-2", children: _jsx(Button, { type: "submit", isLoading: isLoading, className: "w-full", children: "Sign In" }) })] }), _jsx("div", { className: "mt-6 border-t border-slate-100 dark:border-slate-700/60 pt-4 text-center", children: _jsxs("p", { className: "text-xs text-slate-600 dark:text-slate-400", children: ["New to MCTEB?", ' ', _jsx(Link, { to: "/register", className: "font-semibold text-civic-deep dark:text-civic-light hover:underline", children: "Register as a borrower" })] }) }), _jsxs("div", { className: "mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-500 dark:text-slate-400", children: [_jsx("p", { className: "font-semibold text-slate-700 dark:text-slate-300 mb-1", children: "Demo Credentials:" }), _jsxs("p", { children: ["Borrower: ", _jsx("code", { className: "text-slate-700 dark:text-slate-300", children: "maria.c@basco.net" }), " / ", _jsx("code", { className: "text-slate-700 dark:text-slate-300", children: "Basco@2026!" })] }), _jsxs("p", { children: ["Staff: ", _jsx("code", { className: "text-slate-700 dark:text-slate-300", children: "staff@basco.gov.ph" }), " / ", _jsx("code", { className: "text-slate-700 dark:text-slate-300", children: "Basco@2026!" })] }), _jsxs("p", { children: ["Admin: ", _jsx("code", { className: "text-slate-700 dark:text-slate-300", children: "admin@basco.gov.ph" }), " / ", _jsx("code", { className: "text-slate-700 dark:text-slate-300", children: "Basco@2026!" })] })] })] }) }) })] }));
}
//# sourceMappingURL=LoginPage.js.map