import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { apiRequest } from '../../lib/api';
import { Alert } from '../../components/ui/Alert';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  ToolBorrowingReceiptModal,
  useReservationApprovalReceipt,
} from '../../components/receipt/ToolBorrowingReceiptModal';
import {
  CalendarCheck,
  ShoppingBag,
  ClipboardList,
  Wrench,
  ArrowRight,
  Check,
  CheckCircle,
  AlertCircle,
  Activity,
  Package,
  FileText,
} from 'lucide-react';
import { formatDate, type Tool, type AuditLog } from '@mcteb/shared';

interface InventoryStatusCounts {
  total: number;
  Available: number;
  Borrowed: number;
  Reserved: number;
  Maintenance: number;
  Archived: number;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{
    reservationsCount: number;
    rentalsCount: number;
    completedRentalsCount: number;
    maintenanceCount: number;
    inventory: InventoryStatusCounts;
  }>({
    reservationsCount: 0,
    rentalsCount: 0,
    completedRentalsCount: 0,
    maintenanceCount: 0,
    inventory: {
      total: 0,
      Available: 0,
      Borrowed: 0,
      Reserved: 0,
      Maintenance: 0,
      Archived: 0,
    },
  });

  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [receiptReservation, setReceiptReservation] = useState<Record<string, unknown> | null>(
    null,
  );

  const loadDashboardData = useCallback(async () => {
    try {
      if (!user) return;

      if (user.role === 'Borrower') {
        const [res, rent, toolsRes] = await Promise.all([
          apiRequest<any[]>('/reservations'),
          apiRequest<any[]>('/rentals'),
          apiRequest<{ items: Tool[]; total: number }>('/tools?limit=100'),
        ]);

        const tools = toolsRes.items || [];
        setStats((prev) => ({
          ...prev,
          reservationsCount: res.length,
          rentalsCount: rent.filter((r) => r.status === 'Borrowed').length,
          completedRentalsCount: rent.filter(
            (r) => r.status === 'Returned' || r.status === 'Completed',
          ).length,
          maintenanceCount: 0,
          inventory: {
            ...prev.inventory,
            total: tools.length,
            Available: tools.filter((t) => t.availability_status === 'Available').length,
          },
        }));

        setRecentItems(res.slice(0, 5));
      } else {
        // Staff / Admin
        const [res, rent, maint, toolsRes, auditRes] = await Promise.all([
          apiRequest<any[]>('/reservations'),
          apiRequest<any[]>('/rentals'),
          apiRequest<any[]>('/maintenance'),
          apiRequest<{ items: Tool[]; total: number }>('/tools?limit=100'),
          apiRequest<{ items: AuditLog[] }>('/audit?limit=6').catch(() => ({ items: [] })),
        ]);

        const tools = toolsRes.items || [];
        const inventoryCounts: InventoryStatusCounts = {
          total: tools.length,
          Available: tools.filter((t) => t.availability_status === 'Available').length,
          Borrowed: tools.filter((t) => t.availability_status === 'Borrowed').length,
          Reserved: tools.filter((t) => t.availability_status === 'Reserved').length,
          Maintenance: tools.filter(
            (t) => t.availability_status === 'Maintenance' || t.availability_status === 'Damaged',
          ).length,
          Archived: tools.filter((t) => t.availability_status === 'Archived').length,
        };

        setStats({
          reservationsCount: res.filter((r) => r.status === 'Pending').length,
          rentalsCount: rent.filter((r) => r.status === 'Borrowed').length,
          completedRentalsCount: rent.filter(
            (r) => r.status === 'Returned' || r.status === 'Completed',
          ).length,
          maintenanceCount: maint.filter((m) => m.status !== 'Completed').length,
          inventory: inventoryCounts,
        });

        setRecentItems(res.filter((r) => r.status === 'Pending').slice(0, 5));
        setActivityLogs(auditRes.items || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const approvalFlow = useReservationApprovalReceipt({
    reviewerName: user?.full_name,
    onApproved: async () => {
      setMessage('Reservation was successfully approved.');
      await loadDashboardData();
    },
  });

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
          <h2 className="text-xl sm:text-2xl font-bold">Mabuhay, {user?.full_name}!</h2>
          <p className="text-emerald-100 text-sm mt-1">
            {isStaffOrAdmin
              ? 'Basco Municipal Community Tool and Equipment Bank — Staff & Admin Operations Console'
              : `Brgy. ${user?.barangay}, ${user?.province || 'Batanes'} — Municipal Equipment Lending Portal`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/catalog">
            <Button size="sm" variant="secondary" className="gap-2">
              <Wrench className="h-4 w-4" /> Browse Catalog
            </Button>
          </Link>
          {!isStaffOrAdmin && (
            <Link to="/my-reservations">
              <Button
                size="sm"
                variant="outline"
                className="gap-2 border-emerald-300 text-white hover:bg-civic-forest"
              >
                <CalendarCheck className="h-4 w-4" /> My Reservations
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Role-Aware Metric Summary Cards */}
      {message && (
        <Alert variant="success" onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
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
                {isStaffOrAdmin ? 'Catalog Equipment' : 'Available Equipment'}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">
                {isStaffOrAdmin ? stats.inventory.total : stats.inventory.Available}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Package className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-civic-accent/50 transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                {isStaffOrAdmin ? 'Open Maintenance' : 'Completed Returns'}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">
                {isStaffOrAdmin ? stats.maintenanceCount : stats.completedRentalsCount}
              </h3>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-slate-600 dark:text-slate-300">
              {isStaffOrAdmin ? (
                <ClipboardList className="h-6 w-6" />
              ) : (
                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin & Staff Inventory Breakdown */}
      {isStaffOrAdmin && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Inventory Availability Breakdown ({stats.inventory.total} Catalog Items)
              </h3>
              <Link
                to="/staff/inventory"
                className="text-xs font-semibold text-civic-deep dark:text-civic-light hover:underline flex items-center gap-1"
              >
                Manage Inventory <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                {
                  label: 'Available',
                  count: stats.inventory.Available,
                  color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
                },
                {
                  label: 'Borrowed',
                  count: stats.inventory.Borrowed,
                  color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
                },
                {
                  label: 'Reserved',
                  count: stats.inventory.Reserved,
                  color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
                },
                {
                  label: 'Maintenance',
                  count: stats.inventory.Maintenance,
                  color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40',
                },
                {
                  label: 'Archived',
                  count: stats.inventory.Archived,
                  color: 'text-slate-600 bg-slate-100 dark:bg-slate-800',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`p-3 rounded-xl border border-slate-200/70 dark:border-slate-700 ${stat.color}`}
                >
                  <p className="text-[11px] font-semibold uppercase">{stat.label}</p>
                  <p className="text-xl font-bold mt-0.5">{stat.count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Priority Action Queue & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Reservations Queue */}
          <div className="space-y-3">
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
                            {item.borrower_name} &bull; {formatDate(item.pickup_date)} to{' '}
                            {formatDate(item.return_date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                        <Badge status={item.status} />
                        {(item.status === 'Approved' || item.status === 'Completed') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => {
                              approvalFlow.closeApproval();
                              setReceiptReservation(item);
                            }}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Borrowing Receipt
                          </Button>
                        )}
                        {isStaffOrAdmin && item.status === 'Pending' && (
                          <Button
                            size="sm"
                            variant="primary"
                            className="gap-1.5"
                            onClick={() => {
                              setReceiptReservation(null);
                              approvalFlow.openApproval(item);
                            }}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                        )}
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
        </div>

        {/* Right Column: Activity Logs (Staff/Admin) + Municipal Guidelines */}
        <div className="space-y-6">
          {isStaffOrAdmin && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-civic-accent" /> Recent Activity Logs
                </h3>
                <Link
                  to="/admin/audit"
                  className="text-xs font-semibold text-civic-deep dark:text-civic-light hover:underline"
                >
                  Full Log
                </Link>
              </div>
              <Card>
                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {activityLogs.length === 0 ? (
                    <p className="p-4 text-xs text-slate-500">No recent activity logged.</p>
                  ) : (
                    activityLogs.map((log) => (
                      <div key={log.id} className="p-3 text-xs space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 line-clamp-2">
                          <strong>{log.actor_name}</strong>: {log.details}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Municipal Guidelines
            </h3>
            <Card>
              <CardContent className="p-5 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-civic-accent flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Eligibility (18+):</strong> Borrowers must be at least 18 years old and
                    provide complete residential details.
                  </p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle className="h-4 w-4 text-civic-accent flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Municipal Tool Bank:</strong> All equipment is managed by Municipal
                    Staff and lent free of charge to verified Basco residents.
                  </p>
                </div>
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Typhoon Preparedness:</strong> Emergency dewatering pumps and generators
                    are prioritized during storm alerts.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <ToolBorrowingReceiptModal
        isOpen={approvalFlow.isApproving || !!receiptReservation}
        onClose={() => {
          if (approvalFlow.isApproving) {
            approvalFlow.closeApproval();
          } else {
            setReceiptReservation(null);
          }
        }}
        source={approvalFlow.source ?? receiptReservation}
      />
    </div>
  );
}
