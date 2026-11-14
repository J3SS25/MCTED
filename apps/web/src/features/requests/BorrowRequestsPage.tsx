import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Skeleton';
import { BorrowRequestModal } from './BorrowRequestModal';
import {
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Search,
  Plus,
  ArrowRight,
  UserCheck,
  Building,
  Filter,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { formatDate, formatPHP } from '@mcteb/shared';
import type { BorrowRequest } from '@mcteb/shared';

export function BorrowRequestsPage() {
  const { user } = useAuth();

  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isStaffOrAdmin = Boolean(
    user && ['Administrator', 'Admin', 'Municipal Staff', 'Staff'].includes(user.role),
  );

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<BorrowRequest[]>('/requests');
      setRequests(data);
    } catch (err: unknown) {
      console.error('Failed to load borrow requests', err);
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load borrow requests',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Update status action (Approve, Reject, Cancel, Returned)
  const handleStatusUpdate = async (
    requestId: string,
    newStatus: 'approved' | 'rejected' | 'returned' | 'cancelled',
  ) => {
    const actionNames: Record<string, string> = {
      approved: 'approve',
      rejected: 'reject',
      returned: 'mark as returned',
      cancelled: 'cancel',
    };

    if (
      !window.confirm(
        `Are you sure you want to ${actionNames[newStatus] || newStatus} this borrow request?`,
      )
    ) {
      return;
    }

    setActionLoadingId(requestId);
    setFeedback(null);

    try {
      await apiRequest(`/requests/${requestId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      setFeedback({
        type: 'success',
        message: `Borrow request successfully ${
          newStatus === 'returned' ? 'marked as returned' : newStatus
        }.`,
      });
      await fetchRequests();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : `Failed to update request status to ${newStatus}.`,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Partition requests into "Outgoing" (my requests) and "Incoming" (requests for items I own / staff oversight)
  const outgoingRequests = useMemo(() => {
    if (!user) return [];
    return requests.filter((r) => r.borrower_id === user.id);
  }, [requests, user]);

  const incomingRequests = useMemo(() => {
    if (!user) return [];
    if (isStaffOrAdmin) {
      return requests;
    }
    return requests.filter((r) => r.lender_id === user.id);
  }, [requests, user, isStaffOrAdmin]);

  const currentTabItems = activeTab === 'outgoing' ? outgoingRequests : incomingRequests;

  // Filter by status and search query
  const filteredRequests = useMemo(() => {
    return currentTabItems.filter((item) => {
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const toolMatch = item.tool_name?.toLowerCase().includes(query);
        const borrowerMatch = item.borrower_name?.toLowerCase().includes(query);
        const lenderMatch = item.lender_name?.toLowerCase().includes(query);
        const categoryMatch = item.tool_category?.toLowerCase().includes(query);
        return toolMatch || borrowerMatch || lenderMatch || categoryMatch;
      }
      return true;
    });
  }, [currentTabItems, statusFilter, searchQuery]);

  // Statistics KPIs
  const stats = useMemo(() => {
    const list = currentTabItems;
    return {
      total: list.length,
      pending: list.filter((r) => r.status === 'pending').length,
      approved: list.filter((r) => r.status === 'approved').length,
      returned: list.filter((r) => r.status === 'returned').length,
    };
  }, [currentTabItems]);

  const calculateDays = (start: string, end: string): number => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-civic-forest dark:text-civic-light" />
            Equipment Borrow Requests
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track, review, and manage municipal and community tool borrowing workflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
            title="Refresh requests"
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-civic-forest hover:bg-civic-deep text-white"
          >
            <Plus className="h-4 w-4" />
            New Borrow Request
          </Button>
        </div>
      </div>

      {feedback && (
        <Alert variant={feedback.type}>
          <span>{feedback.message}</span>
        </Alert>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Requests</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {stats.total}
              </p>
            </div>
            <div className="p-2.5 bg-slate-100 dark:bg-slate-700/60 rounded-xl text-slate-600 dark:text-slate-300">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase">Pending Review</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                {stats.pending}
              </p>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase">Approved / Active</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                {stats.approved}
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase">Returned</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-0.5">
                {stats.returned}
              </p>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
              <RotateCcw className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Search Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('outgoing');
                setStatusFilter('all');
              }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'outgoing'
                  ? 'bg-civic-forest text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              My Borrow Requests
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'outgoing'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {outgoingRequests.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('incoming');
                setStatusFilter('all');
              }}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'incoming'
                  ? 'bg-civic-forest text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {isStaffOrAdmin ? 'Staff Review Queue' : 'Incoming Requests for My Items'}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'incoming'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {incomingRequests.length}
              </span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tool or resident..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-deep"
            />
          </div>
        </div>

        {/* Status Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Status:
          </span>
          {['all', 'pending', 'approved', 'rejected', 'returned', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full font-medium capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List Content */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12 text-slate-400 stroke-1" />}
          title={
            searchQuery || statusFilter !== 'all'
              ? 'No matching requests found'
              : activeTab === 'outgoing'
              ? 'No borrow requests yet'
              : 'No incoming requests to review'
          }
          description={
            searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search query or status filter.'
              : activeTab === 'outgoing'
              ? 'Browse the equipment catalog and request shared municipal tools for your community or household tasks.'
              : 'When residents request tools that you have shared or that require municipal verification, they will appear here.'
          }
          actionText={activeTab === 'outgoing' ? 'Browse Catalog' : undefined}
          onAction={activeTab === 'outgoing' ? () => (window.location.href = '/catalog') : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const days = calculateDays(req.start_date, req.end_date);
            const dailyCentavos = req.daily_rate_centavos || req.rental_fee_centavos || 0;
            const totalFee = dailyCentavos * days;

            const isRequester = user && req.borrower_id === user.id;
            const isLender = user && req.lender_id === user.id;
            const canApproveOrReject =
              (isLender || isStaffOrAdmin) && req.status === 'pending';
            const canMarkReturned =
              (isLender || isStaffOrAdmin) && req.status === 'approved';
            const canCancel =
              isRequester && (req.status === 'pending' || req.status === 'approved');

            return (
              <Card
                key={req.id}
                className="hover:border-slate-300 dark:hover:border-slate-600 transition-all border border-slate-200 dark:border-slate-700"
              >
                <CardContent className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left: Tool thumbnail & Details */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 dark:bg-slate-800 p-2 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700">
                      <img
                        src={req.tool_image_url || '/equipment/fallback.svg'}
                        alt={req.tool_name || 'Equipment'}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/equipment/fallback.svg';
                        }}
                      />
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                          {req.tool_name || 'Community Equipment'}
                        </h3>
                        {req.tool_category && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                            {req.tool_category}
                          </span>
                        )}
                        <Badge status={req.status} />
                      </div>

                      {/* Dates and Duration */}
                      <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                        <Calendar className="h-3.5 w-3.5 text-civic-accent flex-shrink-0" />
                        <span>
                          <strong>{formatDate(req.start_date)}</strong> &rarr;{' '}
                          <strong>{formatDate(req.end_date)}</strong>
                        </span>
                        <span className="text-slate-400">&bull;</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {days} {days === 1 ? 'day' : 'days'}
                        </span>
                        <span className="text-slate-400">&bull;</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          Total: {formatPHP(totalFee)}
                        </span>
                      </p>

                      {/* Borrower and Lender tags */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                          Borrower: <strong className="text-slate-700 dark:text-slate-200">{req.borrower_name || 'Resident'}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="h-3.5 w-3.5 text-slate-400" />
                          Provider:{' '}
                          <strong className="text-slate-700 dark:text-slate-200">
                            {req.lender_name || 'Basco Municipal Tool Bank'}
                          </strong>
                        </span>
                      </div>

                      {/* Intended Usage / Request Message */}
                      {req.request_message && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                          &ldquo;{req.request_message}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800 w-full lg:w-auto justify-end">
                    {/* Lender / Staff: Approve */}
                    {canApproveOrReject && (
                      <>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                          isLoading={actionLoadingId === req.id}
                          onClick={() => handleStatusUpdate(req.id, 'approved')}
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1"
                          isLoading={actionLoadingId === req.id}
                          onClick={() => handleStatusUpdate(req.id, 'rejected')}
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </>
                    )}

                    {/* Lender / Staff: Mark as Returned */}
                    {canMarkReturned && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-1"
                        isLoading={actionLoadingId === req.id}
                        onClick={() => handleStatusUpdate(req.id, 'returned')}
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Mark Returned
                      </Button>
                    )}

                    {/* Borrower: Cancel */}
                    {canCancel && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                        isLoading={actionLoadingId === req.id}
                        onClick={() => handleStatusUpdate(req.id, 'cancelled')}
                      >
                        Cancel Request
                      </Button>
                    )}

                    {/* Link to Tool Detail */}
                    <Link to={`/catalog/${req.item_id}`}>
                      <Button variant="ghost" size="sm" className="flex items-center gap-1">
                        View Equipment <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Borrow Request Modal */}
      <BorrowRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchRequests();
        }}
      />
    </div>
  );
}
