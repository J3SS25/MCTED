import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ExternalLink, CalendarCheck } from 'lucide-react';
import { formatDate } from '@mcteb/shared';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { ToolBorrowingReceiptForm } from '../../components/receipt/ToolBorrowingReceiptForm';
import { EmptyState } from '../../components/ui/EmptyState';
import { Select } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';

interface ApprovedReceiptOption {
  key: string;
  label: string;
  sortTime: number;
  record: Record<string, unknown>;
}

export function BorrowingReceiptPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isBorrower = user?.role === 'Borrower';

  const [options, setOptions] = useState<ApprovedReceiptOption[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadApprovedBorrowings() {
      if (!user) {
        if (active) setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [rentals, reservations] = await Promise.all([
          apiRequest<Array<Record<string, any>>>('/rentals'),
          apiRequest<Array<Record<string, any>>>('/reservations'),
        ]);

        const rentalReservationIds = new Set(
          rentals
            .map((r) => r.reservation_id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0),
        );

        const rentalOptions: ApprovedReceiptOption[] = rentals
          .filter(
            (r) =>
              r.status === 'Borrowed' || r.status === 'Returned' || r.status === 'Completed',
          )
          .map((r) => {
            const refCode = `TBR-${String(r.id).slice(0, 8).toUpperCase()}`;
            const party = isBorrower ? '' : ` — ${r.borrower_name}`;
            const datePart = r.due_date ? ` • Due ${formatDate(String(r.due_date))}` : '';
            return {
              key: `rental:${r.id}`,
              label: `${refCode} • ${r.tool_name}${party} (${r.status}${datePart})`,
              sortTime: new Date(String(r.created_at || r.due_date || 0)).getTime() || 0,
              record: r,
            };
          });

        const reservationOptions: ApprovedReceiptOption[] = reservations
          .filter(
            (res) =>
              (res.status === 'Approved' || res.status === 'Completed') &&
              !rentalReservationIds.has(String(res.id)),
          )
          .map((res) => {
            const refCode = `TBR-${String(res.id).slice(0, 8).toUpperCase()}`;
            const party = isBorrower ? '' : ` — ${res.borrower_name}`;
            const datePart = res.pickup_date
              ? ` • Pickup ${formatDate(String(res.pickup_date))}`
              : '';
            return {
              key: `reservation:${res.id}`,
              label: `${refCode} • ${res.tool_name}${party} (${res.status}${datePart})`,
              sortTime:
                new Date(
                  String(res.reviewed_at || res.created_at || res.pickup_date || 0),
                ).getTime() || 0,
              record: res,
            };
          });

        const combined = [...rentalOptions, ...reservationOptions].sort(
          (a, b) => b.sortTime - a.sortTime,
        );

        if (active) {
          setOptions(combined);
          setSelectedKey(combined[0]?.key ?? '');
        }
      } catch (err) {
        console.error('Failed to load approved borrowing records', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadApprovedBorrowings();
    return () => {
      active = false;
    };
  }, [user, isBorrower]);

  const selectedRecord = useMemo(() => {
    if (!selectedKey) return null;
    return options.find((opt) => opt.key === selectedKey)?.record ?? null;
  }, [options, selectedKey]);

  const selectOptions = useMemo(() => {
    const items = options.map((opt) => ({ value: opt.key, label: opt.label }));
    if (!isBorrower) {
      items.push({ value: '', label: 'Blank Receipt Template' });
    }
    return items;
  }, [options, isBorrower]);

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="h-6 w-6 text-civic-forest dark:text-civic-light" />
            Tool Borrowing Receipt Form
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isBorrower
              ? 'Official borrowing receipt issued once Municipal Staff or an Administrator approves your tool borrowing request.'
              : 'Editable digital soft copy and A4 printable hard copy template for approved equipment borrowings, inspection, and return sign-off.'}
          </p>
        </div>

        {!isBorrower && (
          <a
            href="/tool-borrowing-receipt-form.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-civic-forest dark:text-civic-light hover:underline"
          >
            Open Standalone Printable HTML Form
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : isBorrower && options.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-12 w-12 text-slate-400 stroke-1" />}
          title="No approved borrowing receipt yet"
          description="Your Tool Borrowing Receipt will appear here once Municipal Staff or an Administrator approves your tool reservation request."
          actionText="View My Reservations"
          onAction={() => navigate('/my-reservations')}
        />
      ) : (
        <div className="space-y-4">
          {selectOptions.length > 0 && (
            <div className="no-print bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <Select
                label={
                  isBorrower
                    ? 'Approved Tool Borrowing Record'
                    : 'Select Approved Borrowing Record or Blank Template'
                }
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                options={selectOptions}
              />
            </div>
          )}

          <ToolBorrowingReceiptForm initialSource={selectedRecord} />
        </div>
      )}
    </div>
  );
}
