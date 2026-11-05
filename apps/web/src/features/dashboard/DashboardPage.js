import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { CalendarCheck, ShoppingBag, CreditCard, ClipboardList, Wrench, ArrowRight, CheckCircle, AlertCircle, } from 'lucide-react';
import { formatDate } from '@mcteb/shared';
export function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        reservationsCount: 0,
        rentalsCount: 0,
        paymentsCount: 0,
        maintenanceCount: 0,
    });
    const [recentItems, setRecentItems] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function loadDashboardData() {
            try {
                if (!user)
                    return;
                if (user.role === 'Borrower') {
                    const [res, rent, pay] = await Promise.all([
                        apiRequest('/reservations'),
                        apiRequest('/rentals'),
                        apiRequest('/payments'),
                    ]);
                    setStats({
                        reservationsCount: res.length,
                        rentalsCount: rent.filter((r) => r.status === 'Borrowed').length,
                        paymentsCount: pay.length,
                        maintenanceCount: 0,
                    });
                    setRecentItems(res.slice(0, 5));
                }
                else {
                    // Staff / Admin
                    const [res, rent, pay, maint] = await Promise.all([
                        apiRequest('/reservations'),
                        apiRequest('/rentals'),
                        apiRequest('/payments'),
                        apiRequest('/maintenance'),
                    ]);
                    setStats({
                        reservationsCount: res.filter((r) => r.status === 'Pending').length,
                        rentalsCount: rent.filter((r) => r.status === 'Borrowed').length,
                        paymentsCount: pay.filter((p) => p.status === 'Pending').length,
                        maintenanceCount: maint.filter((m) => m.status !== 'Completed').length,
                    });
                    setRecentItems(res.filter((r) => r.status === 'Pending').slice(0, 5));
                }
            }
            catch (err) {
                console.error('Failed to load dashboard data', err);
            }
            finally {
                setLoading(false);
            }
        }
        loadDashboardData();
    }, [user]);
    if (loading) {
        return (_jsxs("div", { className: "space-y-6", children: [_jsx(Skeleton, { className: "h-10 w-64" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx(Skeleton, { className: "h-28 rounded-xl" }), _jsx(Skeleton, { className: "h-28 rounded-xl" }), _jsx(Skeleton, { className: "h-28 rounded-xl" }), _jsx(Skeleton, { className: "h-28 rounded-xl" })] })] }));
    }
    const isStaffOrAdmin = user?.role === 'Municipal Staff' || user?.role === 'Administrator';
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-civic-forest to-civic-deep text-white p-6 rounded-2xl shadow-sm", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-xl sm:text-2xl font-bold", children: ["Mabuhay, ", user?.full_name, "!"] }), _jsx("p", { className: "text-emerald-100 text-sm mt-1", children: isStaffOrAdmin
                                    ? 'Basco Municipal Community Tool and Equipment Bank — Staff Operations Console'
                                    : `Barangay ${user?.barangay} — Municipal Equipment Lending Portal` })] }), _jsx("div", { children: _jsx(Link, { to: "/catalog", children: _jsxs(Button, { size: "sm", variant: "secondary", className: "gap-2", children: [_jsx(Wrench, { className: "h-4 w-4" }), " Browse Catalog"] }) }) })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx(Card, { className: "hover:border-civic-accent/50 transition-colors", children: _jsxs(CardContent, { className: "p-5 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-400", children: isStaffOrAdmin ? 'Pending Requests' : 'My Reservations' }), _jsx("h3", { className: "text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100", children: stats.reservationsCount })] }), _jsx("div", { className: "p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400", children: _jsx(CalendarCheck, { className: "h-6 w-6" }) })] }) }), _jsx(Card, { className: "hover:border-civic-accent/50 transition-colors", children: _jsxs(CardContent, { className: "p-5 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-400", children: isStaffOrAdmin ? 'Active Loans' : 'Active Rentals' }), _jsx("h3", { className: "text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100", children: stats.rentalsCount })] }), _jsx("div", { className: "p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400", children: _jsx(ShoppingBag, { className: "h-6 w-6" }) })] }) }), _jsx(Card, { className: "hover:border-civic-accent/50 transition-colors", children: _jsxs(CardContent, { className: "p-5 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-400", children: isStaffOrAdmin ? 'Payments To Verify' : 'My Payments' }), _jsx("h3", { className: "text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100", children: stats.paymentsCount })] }), _jsx("div", { className: "p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400", children: _jsx(CreditCard, { className: "h-6 w-6" }) })] }) }), _jsx(Card, { className: "hover:border-civic-accent/50 transition-colors", children: _jsxs(CardContent, { className: "p-5 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase text-slate-500 dark:text-slate-400", children: isStaffOrAdmin ? 'Open Maintenance' : 'Account Status' }), _jsx("h3", { className: "text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100", children: isStaffOrAdmin ? stats.maintenanceCount : user?.status })] }), _jsx("div", { className: "p-3 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-slate-600 dark:text-slate-300", children: isStaffOrAdmin ? (_jsx(ClipboardList, { className: "h-6 w-6" })) : (_jsx(CheckCircle, { className: "h-6 w-6 text-emerald-500" })) })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-base font-semibold text-slate-900 dark:text-slate-100", children: isStaffOrAdmin ? 'Pending Reservation Queue' : 'Recent Reservation Requests' }), _jsxs(Link, { to: isStaffOrAdmin ? '/staff/reservations' : '/my-reservations', className: "text-xs font-semibold text-civic-deep dark:text-civic-light hover:underline flex items-center gap-1", children: ["View all ", _jsx(ArrowRight, { className: "h-3.5 w-3.5" })] })] }), recentItems.length === 0 ? (_jsx(Card, { children: _jsx(CardContent, { className: "p-6 text-center text-slate-500 dark:text-slate-400 text-sm", children: "No active or pending reservation requests." }) })) : (_jsx("div", { className: "space-y-3", children: recentItems.map((item) => (_jsx(Card, { className: "hover:border-slate-300 transition-colors", children: _jsxs(CardContent, { className: "p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center p-1 overflow-hidden flex-shrink-0", children: _jsx("img", { src: item.tool_image_url || '/equipment/fallback.svg', alt: item.tool_name, className: "w-full h-full object-contain", onError: (e) => {
                                                                e.target.src = '/equipment/fallback.svg';
                                                            } }) }), _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-sm text-slate-900 dark:text-slate-100", children: item.tool_name }), _jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: [item.borrower_name, " \u2022 ", formatDate(item.pickup_date), " to ", formatDate(item.return_date)] })] })] }), _jsxs("div", { className: "flex items-center gap-3 self-end sm:self-center", children: [_jsx(Badge, { status: item.status }), _jsx(Link, { to: isStaffOrAdmin ? '/staff/reservations' : `/my-reservations`, children: _jsx(Button, { size: "sm", variant: "outline", children: "Details" }) })] })] }) }, item.id))) }))] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-base font-semibold text-slate-900 dark:text-slate-100", children: "Municipal Guidelines" }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-5 space-y-3 text-xs text-slate-600 dark:text-slate-300", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx(CheckCircle, { className: "h-4 w-4 text-civic-accent flex-shrink-0 mt-0.5" }), _jsxs("p", { children: [_jsx("strong", { children: "Basco Residency:" }), " Equipment lending is available to verified residents across all 6 barangays."] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(CheckCircle, { className: "h-4 w-4 text-civic-accent flex-shrink-0 mt-0.5" }), _jsxs("p", { children: [_jsx("strong", { children: "Inspection on Handover:" }), " Tools are inspected for working condition both at pickup and return."] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(AlertCircle, { className: "h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" }), _jsxs("p", { children: [_jsx("strong", { children: "Typhoon Preparedness:" }), " Emergency dewatering pumps and generators are prioritized during storm alerts."] })] })] }) })] })] })] }));
}
//# sourceMappingURL=DashboardPage.js.map