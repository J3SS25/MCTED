import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Wrench, LayoutDashboard, CalendarCheck, ShoppingBag, CreditCard, MessageSquare, Bell, User, Users, ShieldAlert, ClipboardList, SlidersHorizontal, Sun, Moon, LogOut, Menu, X, } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { useTheme } from '../../lib/theme-context';
import { Button } from '../ui/Button';
export function AppShell({ children }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const handleSignOut = async () => {
        await logout();
        navigate('/login');
    };
    // Determine navigation items by role
    let navItems = [];
    if (!user) {
        // Guest Navigation
        navItems = [
            { label: 'Equipment Catalog', href: '/catalog', icon: _jsx(Wrench, { className: "h-5 w-5" }) },
            { label: 'Community Feedback', href: '/feedback', icon: _jsx(MessageSquare, { className: "h-5 w-5" }) },
        ];
    }
    else if (user.role === 'Borrower') {
        // Borrower Navigation
        navItems = [
            { label: 'Dashboard', href: '/dashboard', icon: _jsx(LayoutDashboard, { className: "h-5 w-5" }) },
            { label: 'Equipment Catalog', href: '/catalog', icon: _jsx(Wrench, { className: "h-5 w-5" }) },
            { label: 'My Reservations', href: '/my-reservations', icon: _jsx(CalendarCheck, { className: "h-5 w-5" }) },
            { label: 'My Rentals', href: '/my-rentals', icon: _jsx(ShoppingBag, { className: "h-5 w-5" }) },
            { label: 'Payments & Receipts', href: '/my-payments', icon: _jsx(CreditCard, { className: "h-5 w-5" }) },
            { label: 'Feedback', href: '/feedback', icon: _jsx(MessageSquare, { className: "h-5 w-5" }) },
            { label: 'Notifications', href: '/notifications', icon: _jsx(Bell, { className: "h-5 w-5" }) },
            { label: 'Profile & Settings', href: '/profile', icon: _jsx(User, { className: "h-5 w-5" }) },
        ];
    }
    else if (user.role === 'Municipal Staff') {
        // Municipal Staff Navigation
        navItems = [
            { label: 'Staff Dashboard', href: '/dashboard', icon: _jsx(LayoutDashboard, { className: "h-5 w-5" }) },
            { label: 'Equipment Catalog', href: '/catalog', icon: _jsx(Wrench, { className: "h-5 w-5" }) },
            { label: 'Reservation Queue', href: '/staff/reservations', icon: _jsx(CalendarCheck, { className: "h-5 w-5" }) },
            { label: 'Rental Desk', href: '/staff/rentals', icon: _jsx(ShoppingBag, { className: "h-5 w-5" }) },
            { label: 'Inventory Management', href: '/staff/inventory', icon: _jsx(SlidersHorizontal, { className: "h-5 w-5" }) },
            { label: 'Payment Verification', href: '/staff/payments', icon: _jsx(CreditCard, { className: "h-5 w-5" }) },
            { label: 'Maintenance Board', href: '/staff/maintenance', icon: _jsx(ClipboardList, { className: "h-5 w-5" }) },
            { label: 'Feedback Moderation', href: '/staff/feedback', icon: _jsx(MessageSquare, { className: "h-5 w-5" }) },
            { label: 'Notifications', href: '/notifications', icon: _jsx(Bell, { className: "h-5 w-5" }) },
            { label: 'Profile', href: '/profile', icon: _jsx(User, { className: "h-5 w-5" }) },
        ];
    }
    else if (user.role === 'Administrator') {
        // Administrator Navigation
        navItems = [
            { label: 'Admin Dashboard', href: '/dashboard', icon: _jsx(LayoutDashboard, { className: "h-5 w-5" }) },
            { label: 'Equipment Catalog', href: '/catalog', icon: _jsx(Wrench, { className: "h-5 w-5" }) },
            { label: 'Reservation Queue', href: '/staff/reservations', icon: _jsx(CalendarCheck, { className: "h-5 w-5" }) },
            { label: 'Rental Desk', href: '/staff/rentals', icon: _jsx(ShoppingBag, { className: "h-5 w-5" }) },
            { label: 'Inventory Management', href: '/staff/inventory', icon: _jsx(SlidersHorizontal, { className: "h-5 w-5" }) },
            { label: 'Payment Verification', href: '/staff/payments', icon: _jsx(CreditCard, { className: "h-5 w-5" }) },
            { label: 'Maintenance Board', href: '/staff/maintenance', icon: _jsx(ClipboardList, { className: "h-5 w-5" }) },
            { label: 'Feedback Moderation', href: '/staff/feedback', icon: _jsx(MessageSquare, { className: "h-5 w-5" }) },
            { label: 'User Oversight', href: '/admin/users', icon: _jsx(Users, { className: "h-5 w-5" }) },
            { label: 'System Audit Log', href: '/admin/audit', icon: _jsx(ShieldAlert, { className: "h-5 w-5" }) },
            { label: 'Notifications', href: '/notifications', icon: _jsx(Bell, { className: "h-5 w-5" }) },
            { label: 'Profile', href: '/profile', icon: _jsx(User, { className: "h-5 w-5" }) },
        ];
    }
    return (_jsxs("div", { className: "flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden", children: [_jsxs("aside", { className: "hidden lg:flex flex-col w-64 bg-civic-forest text-white border-r border-civic-deep flex-shrink-0", children: [_jsxs("div", { className: "h-16 flex items-center px-6 gap-3 border-b border-civic-deep/60", children: [_jsx("div", { className: "p-2 bg-civic-accent/30 rounded-lg", children: _jsx(Wrench, { className: "h-5 w-5 text-civic-light" }) }), _jsxs("div", { children: [_jsx("h1", { className: "font-bold text-sm tracking-wide", children: "MCTEB BASCO" }), _jsx("p", { className: "text-[10px] text-emerald-200 uppercase tracking-wider", children: "Tool Bank" })] })] }), _jsx("nav", { className: "flex-1 px-3 py-4 space-y-1 overflow-y-auto", children: navItems.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (_jsxs(Link, { to: item.href, className: `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-civic-accent text-white shadow-sm'
                                    : 'text-emerald-100 hover:bg-civic-deep/50 hover:text-white'}`, children: [item.icon, _jsx("span", { children: item.label })] }, item.href));
                        }) }), user ? (_jsxs("div", { className: "p-4 border-t border-civic-deep/60 bg-civic-forest/80", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("div", { className: "w-9 h-9 rounded-full bg-civic-accent flex items-center justify-center font-bold text-sm text-white", children: user.full_name.charAt(0) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs font-semibold truncate text-white", children: user.full_name }), _jsx("p", { className: "text-[10px] text-emerald-200 truncate", children: user.role })] })] }), _jsxs("button", { onClick: handleSignOut, className: "w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium bg-civic-deep/40 hover:bg-civic-deep text-emerald-100 transition-colors", children: [_jsx(LogOut, { className: "h-3.5 w-3.5" }), "Sign Out"] })] })) : (_jsxs("div", { className: "p-4 border-t border-civic-deep/60 space-y-2", children: [_jsx(Link, { to: "/login", className: "block w-full", children: _jsx(Button, { size: "sm", variant: "secondary", className: "w-full", children: "Sign In" }) }), _jsx(Link, { to: "/register", className: "block w-full", children: _jsx(Button, { size: "sm", variant: "outline", className: "w-full border-emerald-400 text-white hover:bg-civic-deep", children: "Register" }) })] }))] }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0 overflow-hidden", children: [_jsxs("header", { className: "h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 z-10", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: () => setMobileMenuOpen(true), className: "lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none", "aria-label": "Open mobile menu", children: _jsx(Menu, { className: "h-5 w-5" }) }), _jsxs("div", { className: "lg:hidden flex items-center gap-2", children: [_jsx(Wrench, { className: "h-5 w-5 text-civic-deep" }), _jsx("span", { className: "font-bold text-sm", children: "MCTEB Basco" })] })] }), _jsxs("div", { className: "flex items-center gap-2 sm:gap-4", children: [_jsx("button", { onClick: toggleTheme, className: "p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 focus:outline-none", "aria-label": "Toggle light or dark theme", children: theme === 'dark' ? _jsx(Sun, { className: "h-5 w-5" }) : _jsx(Moon, { className: "h-5 w-5" }) }), user && (_jsx(Link, { to: "/notifications", className: "relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 focus:outline-none", "aria-label": "View notifications", children: _jsx(Bell, { className: "h-5 w-5" }) })), !user && (_jsxs("div", { className: "hidden sm:flex items-center gap-2", children: [_jsx(Link, { to: "/login", children: _jsx(Button, { size: "sm", variant: "outline", children: "Sign In" }) }), _jsx(Link, { to: "/register", children: _jsx(Button, { size: "sm", children: "Register" }) })] }))] })] }), mobileMenuOpen && (_jsxs("div", { className: "fixed inset-0 z-50 lg:hidden", children: [_jsx("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-sm", onClick: () => setMobileMenuOpen(false) }), _jsxs("div", { className: "fixed inset-y-0 left-0 w-64 bg-civic-forest text-white p-4 flex flex-col shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between pb-4 border-b border-civic-deep", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Wrench, { className: "h-5 w-5 text-civic-light" }), _jsx("span", { className: "font-bold text-sm", children: "MCTEB BASCO" })] }), _jsx("button", { onClick: () => setMobileMenuOpen(false), className: "p-1 rounded-lg hover:bg-civic-deep", children: _jsx(X, { className: "h-5 w-5" }) })] }), _jsx("nav", { className: "flex-1 py-4 space-y-1 overflow-y-auto", children: navItems.map((item) => (_jsxs(Link, { to: item.href, onClick: () => setMobileMenuOpen(false), className: "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-emerald-100 hover:bg-civic-deep hover:text-white", children: [item.icon, _jsx("span", { children: item.label })] }, item.href))) }), user ? (_jsxs("button", { onClick: () => {
                                            setMobileMenuOpen(false);
                                            handleSignOut();
                                        }, className: "w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs bg-civic-deep hover:bg-civic-deep/80 text-white", children: [_jsx(LogOut, { className: "h-4 w-4" }), " Sign Out"] })) : (_jsxs("div", { className: "space-y-2", children: [_jsx(Link, { to: "/login", onClick: () => setMobileMenuOpen(false), children: _jsx(Button, { size: "sm", variant: "secondary", className: "w-full mb-2", children: "Sign In" }) }), _jsx(Link, { to: "/register", onClick: () => setMobileMenuOpen(false), children: _jsx(Button, { size: "sm", variant: "outline", className: "w-full text-white border-emerald-400", children: "Register" }) })] }))] })] })), _jsx("main", { className: "flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8", children: _jsx("div", { className: "max-w-7xl mx-auto", children: children }) })] })] }));
}
//# sourceMappingURL=AppShell.js.map