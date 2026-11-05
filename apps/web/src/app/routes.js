import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
// Feature Pages
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { CatalogPage } from '../features/catalog/CatalogPage';
import { ToolDetailPage } from '../features/catalog/ToolDetailPage';
import { MyReservationsPage } from '../features/reservations/MyReservationsPage';
import { ReservationQueuePage } from '../features/reservations/ReservationQueuePage';
import { MyRentalsPage } from '../features/rentals/MyRentalsPage';
import { RentalDeskPage } from '../features/rentals/RentalDeskPage';
import { MyPaymentsPage } from '../features/payments/MyPaymentsPage';
import { PaymentVerificationPage } from '../features/payments/PaymentVerificationPage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { MaintenancePage } from '../features/maintenance/MaintenancePage';
import { FeedbackPage } from '../features/feedback/FeedbackPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { UsersPage } from '../features/admin/UsersPage';
import { AuditLogPage } from '../features/admin/AuditLogPage';
export function AppRoutes() {
    const { user } = useAuth();
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: user ? '/dashboard' : '/catalog', replace: true }) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/catalog", element: _jsx(CatalogPage, {}) }), _jsx(Route, { path: "/catalog/:id", element: _jsx(ToolDetailPage, {}) }), _jsx(Route, { path: "/feedback", element: _jsx(FeedbackPage, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { children: _jsx(DashboardPage, {}) }) }), _jsx(Route, { path: "/my-reservations", element: _jsx(ProtectedRoute, { children: _jsx(MyReservationsPage, {}) }) }), _jsx(Route, { path: "/my-rentals", element: _jsx(ProtectedRoute, { children: _jsx(MyRentalsPage, {}) }) }), _jsx(Route, { path: "/my-payments", element: _jsx(ProtectedRoute, { children: _jsx(MyPaymentsPage, {}) }) }), _jsx(Route, { path: "/notifications", element: _jsx(ProtectedRoute, { children: _jsx(NotificationsPage, {}) }) }), _jsx(Route, { path: "/profile", element: _jsx(ProtectedRoute, { children: _jsx(ProfilePage, {}) }) }), _jsx(Route, { path: "/staff/reservations", element: _jsx(ProtectedRoute, { allowedRoles: ['Municipal Staff', 'Administrator'], children: _jsx(ReservationQueuePage, {}) }) }), _jsx(Route, { path: "/staff/rentals", element: _jsx(ProtectedRoute, { allowedRoles: ['Municipal Staff', 'Administrator'], children: _jsx(RentalDeskPage, {}) }) }), _jsx(Route, { path: "/staff/inventory", element: _jsx(ProtectedRoute, { allowedRoles: ['Municipal Staff', 'Administrator'], children: _jsx(InventoryPage, {}) }) }), _jsx(Route, { path: "/staff/payments", element: _jsx(ProtectedRoute, { allowedRoles: ['Municipal Staff', 'Administrator'], children: _jsx(PaymentVerificationPage, {}) }) }), _jsx(Route, { path: "/staff/maintenance", element: _jsx(ProtectedRoute, { allowedRoles: ['Municipal Staff', 'Administrator'], children: _jsx(MaintenancePage, {}) }) }), _jsx(Route, { path: "/staff/feedback", element: _jsx(ProtectedRoute, { allowedRoles: ['Municipal Staff', 'Administrator'], children: _jsx(FeedbackPage, {}) }) }), _jsx(Route, { path: "/admin/users", element: _jsx(ProtectedRoute, { allowedRoles: ['Administrator'], children: _jsx(UsersPage, {}) }) }), _jsx(Route, { path: "/admin/audit", element: _jsx(ProtectedRoute, { allowedRoles: ['Administrator'], children: _jsx(AuditLogPage, {}) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
//# sourceMappingURL=routes.js.map