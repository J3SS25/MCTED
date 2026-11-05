import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  CalendarCheck,
  ShoppingBag,
  CreditCard,
  ClipboardList,
  Wrench,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { formatPHP, formatDate } from '@mcteb/shared';

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{
    reservationsCount: number;
    rentalsCount: number;
    paymentsCount: number;
    maintenanceCount: number;
  }>({
    reservationsCount: 0,
    rentalsCount: 0,
    paymentsCount: 0,
    maintenanceCount: 0,
  });

  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        if (!user) return;

        if (user.role === 'Borrower') {
          const [res, rent, pay] = await Promise.all([
            apiRequest<any[]>('/reservations'),
            apiRequest<any[]>('/rentals'),
            apiRequest<any[]>('/payments'),
          ]);

          setStats({
            reservationsCount: res.length,
            rentalsCount: rent.filter((r) => r.status === 'Borrowed').length,
            paymentsCount: pay.length,
            maintenanceCount: 0,
          });

          setRecentItems(res.slice(0, 5));
        } else {
          // Staff / Admin
          const [res, rent, pay, maint] = await Promise.all([
            apiRequest<any[]>('/reservations'),
            apiRequest<any[]>('/rentals'),
            apiRequest<any[]>('/payments'),
            apiRequest<any[]>('/maintenance'),
          ]);

          setStats({
            reservationsCount: res.filter((r) => r.status === 'Pending').length,
            rentalsCount: rent.filter((r) => r.status === 'Borrowed').length,
            paymentsCount: pay.filter((p) => p.status === 'Pending').length,
            maintenanceCount: maint.filter((m) => m.status !== 'Completed').length,
          });

          setRecentItems(res.filter((r) => r.status === 'Pending').slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </div>
    );
  }

  const isStaffOrAdmin = user?.role === 'Municipal Staff' || user?.role === 'Administrator';

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-civic-forest to-civic-deep text-white p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">
            Mabuhay, {user?.full_name}!
          </h2>
          <p className="text-emerald-100 text-sm mt-1">
            {isStaffOrAdmin
              ? 'Basco Municipal Community Tool and Equipment Bank — Staff Operations Console'
              : `Barangay ${user?.barangay} — Municipal Equipment Lending Portal`}
          </p>
        </div>

        <div>
          <Link to="/catalog">
            <Button size="sm" variant="secondary" className="gap-2">
              <Wrench className="h-4 w-4" /> Browse Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* Role-Aware Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-civic-accent/50 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                {isStaffOrAdmin ? 'Pending Requests' : 'My Reservations'}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">
                {stats.reservationsCount}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
              <CalendarCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-civic-accent/50 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                {isStaffOrAdmin ? 'Active Loans' : 'Active Rentals'}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">
                {stats.rentalsCount}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-civic-accent/50 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                {isStaffOrAdmin ? 'Payments To Verify' : 'My Payments'}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">
                {stats.paymentsCount}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CreditCard className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-civic-accent/50 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                {isStaffOrAdmin ? 'Open Maintenance' : 'Account Status'}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">
                {isStaffOrAdmin ? stats.maintenanceCount : user?.status}
              </h3>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-slate-600 dark:text-slate-300">
              {isStaffOrAdmin ? (
                <ClipboardList className="h-6 w-6" />
              ) : (
                <CheckCircle className="h-6 w-6 text-emerald-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Action Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {isStaffOrAdmin ? 'Pending Reservation Queue' : 'Recent Reservation Requests'}
            </h3>
            <Link
              to={isStaffOrAdmin ? '/staff/reservations' : '/my-reservations'}
              className="text-xs font-semibold text-civic-deep dark:text-civic-light hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentItems.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                No active or pending reservation requests.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentItems.map((item) => (
                <Card key={item.id} className="hover:border-slate-300 transition-colors">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                        <img
                          src={item.tool_image_url || '/equipment/fallback.svg'}
                          alt={item.tool_name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/equipment/fallback.svg';
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {item.tool_name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.borrower_name} &bull; {formatDate(item.pickup_date)} to {formatDate(item.return_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <Badge status={item.status} />
                      <Link to={isStaffOrAdmin ? '/staff/reservations' : `/my-reservations`}>
                        <Button size="sm" variant="outline">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Civic notices & guidance */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Municipal Guidelines
          </h3>
          <Card>
            <CardContent className="p-5 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-civic-accent flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Basco Residency:</strong> Equipment lending is available to verified residents across all 6 barangays.
                </p>
              </div>
              <div className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-civic-accent flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Inspection on Handover:</strong> Tools are inspected for working condition both at pickup and return.
                </p>
              </div>
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Typhoon Preparedness:</strong> Emergency dewatering pumps and generators are prioritized during storm alerts.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

