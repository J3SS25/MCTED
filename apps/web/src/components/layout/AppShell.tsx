import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Wrench,
  LayoutDashboard,
  CalendarCheck,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  Bell,
  User,
  Users,
  ShieldAlert,
  ClipboardList,
  SlidersHorizontal,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { useTheme } from '../../lib/theme-context';
import { Button } from '../ui/Button';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

export function AppShell({ children }: { children: React.ReactNode }) {
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
  let navItems: NavItem[] = [];

  if (!user) {
    // Guest Navigation
    navItems = [
      { label: 'Equipment Catalog', href: '/catalog', icon: <Wrench className="h-5 w-5" /> },
      { label: 'Community Feedback', href: '/feedback', icon: <MessageSquare className="h-5 w-5" /> },
    ];
  } else if (user.role === 'Borrower') {
    // Borrower Navigation
    navItems = [
      { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
      { label: 'Equipment Catalog', href: '/catalog', icon: <Wrench className="h-5 w-5" /> },
      { label: 'My Reservations', href: '/my-reservations', icon: <CalendarCheck className="h-5 w-5" /> },
      { label: 'My Rentals', href: '/my-rentals', icon: <ShoppingBag className="h-5 w-5" /> },
      { label: 'Payments & Receipts', href: '/my-payments', icon: <CreditCard className="h-5 w-5" /> },
      { label: 'Feedback', href: '/feedback', icon: <MessageSquare className="h-5 w-5" /> },
      { label: 'Notifications', href: '/notifications', icon: <Bell className="h-5 w-5" /> },
      { label: 'Profile & Settings', href: '/profile', icon: <User className="h-5 w-5" /> },
    ];
  } else if (user.role === 'Municipal Staff') {
    // Municipal Staff Navigation
    navItems = [
      { label: 'Staff Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
      { label: 'Equipment Catalog', href: '/catalog', icon: <Wrench className="h-5 w-5" /> },
      { label: 'Reservation Queue', href: '/staff/reservations', icon: <CalendarCheck className="h-5 w-5" /> },
      { label: 'Rental Desk', href: '/staff/rentals', icon: <ShoppingBag className="h-5 w-5" /> },
      { label: 'Inventory Management', href: '/staff/inventory', icon: <SlidersHorizontal className="h-5 w-5" /> },
      { label: 'Payment Verification', href: '/staff/payments', icon: <CreditCard className="h-5 w-5" /> },
      { label: 'Maintenance Board', href: '/staff/maintenance', icon: <ClipboardList className="h-5 w-5" /> },
      { label: 'Feedback Moderation', href: '/staff/feedback', icon: <MessageSquare className="h-5 w-5" /> },
      { label: 'Notifications', href: '/notifications', icon: <Bell className="h-5 w-5" /> },
      { label: 'Profile', href: '/profile', icon: <User className="h-5 w-5" /> },
    ];
  } else if (user.role === 'Administrator') {
    // Administrator Navigation
    navItems = [
      { label: 'Admin Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
      { label: 'Equipment Catalog', href: '/catalog', icon: <Wrench className="h-5 w-5" /> },
      { label: 'Reservation Queue', href: '/staff/reservations', icon: <CalendarCheck className="h-5 w-5" /> },
      { label: 'Rental Desk', href: '/staff/rentals', icon: <ShoppingBag className="h-5 w-5" /> },
      { label: 'Inventory Management', href: '/staff/inventory', icon: <SlidersHorizontal className="h-5 w-5" /> },
      { label: 'Payment Verification', href: '/staff/payments', icon: <CreditCard className="h-5 w-5" /> },
      { label: 'Maintenance Board', href: '/staff/maintenance', icon: <ClipboardList className="h-5 w-5" /> },
      { label: 'Feedback Moderation', href: '/staff/feedback', icon: <MessageSquare className="h-5 w-5" /> },
      { label: 'User Oversight', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
      { label: 'System Audit Log', href: '/admin/audit', icon: <ShieldAlert className="h-5 w-5" /> },
      { label: 'Notifications', href: '/notifications', icon: <Bell className="h-5 w-5" /> },
      { label: 'Profile', href: '/profile', icon: <User className="h-5 w-5" /> },
    ];
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-civic-forest text-white border-r border-civic-deep flex-shrink-0">
        <div className="h-16 flex items-center px-6 gap-3 border-b border-civic-deep/60">
          <div className="p-2 bg-civic-accent/30 rounded-lg">
            <Wrench className="h-5 w-5 text-civic-light" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide">MCTEB BASCO</h1>
            <p className="text-[10px] text-emerald-200 uppercase tracking-wider">Tool Bank</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-civic-accent text-white shadow-sm'
                    : 'text-emerald-100 hover:bg-civic-deep/50 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {user ? (
          <div className="p-4 border-t border-civic-deep/60 bg-civic-forest/80">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-civic-accent flex items-center justify-center font-bold text-sm text-white">
                {user.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate text-white">{user.full_name}</p>
                <p className="text-[10px] text-emerald-200 truncate">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-medium bg-civic-deep/40 hover:bg-civic-deep text-emerald-100 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="p-4 border-t border-civic-deep/60 space-y-2">
            <Link to="/login" className="block w-full">
              <Button size="sm" variant="secondary" className="w-full">
                Sign In
              </Button>
            </Link>
            <Link to="/register" className="block w-full">
              <Button size="sm" variant="outline" className="w-full border-emerald-400 text-white hover:bg-civic-deep">
                Register
              </Button>
            </Link>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none"
              aria-label="Open mobile menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <Wrench className="h-5 w-5 text-civic-deep" />
              <span className="font-bold text-sm">MCTEB Basco</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 focus:outline-none"
              aria-label="Toggle light or dark theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user && (
              <Link
                to="/notifications"
                className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 focus:outline-none"
                aria-label="View notifications"
              >
                <Bell className="h-5 w-5" />
              </Link>
            )}

            {!user && (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login">
                  <Button size="sm" variant="outline">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-64 bg-civic-forest text-white p-4 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-civic-deep">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-civic-light" />
                  <span className="font-bold text-sm">MCTEB BASCO</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg hover:bg-civic-deep">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-emerald-100 hover:bg-civic-deep hover:text-white"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              {user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs bg-civic-deep hover:bg-civic-deep/80 text-white"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              ) : (
                <div className="space-y-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" variant="secondary" className="w-full mb-2">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" variant="outline" className="w-full text-white border-emerald-400">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Main View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

