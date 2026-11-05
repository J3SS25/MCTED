import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { Skeleton } from '../ui/Skeleton';
export function ProtectedRoute({ children, allowedRoles }) {
    const { user, isLoading } = useAuth();
    const location = useLocation();
    if (isLoading) {
        return (_jsxs("div", { className: "p-8 max-w-4xl mx-auto space-y-4", children: [_jsx(Skeleton, { className: "h-8 w-48" }), _jsx(Skeleton, { className: "h-4 w-72" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 pt-4", children: [_jsx(Skeleton, { className: "h-32 rounded-xl" }), _jsx(Skeleton, { className: "h-32 rounded-xl" }), _jsx(Skeleton, { className: "h-32 rounded-xl" })] })] }));
    }
    if (!user) {
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return _jsx(Navigate, { to: "/dashboard", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
//# sourceMappingURL=ProtectedRoute.js.map