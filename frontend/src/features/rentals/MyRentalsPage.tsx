import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { ToolBorrowingReceiptModal } from '../../components/receipt/ToolBorrowingReceiptModal';
import { ShoppingBag, AlertTriangle, FileText } from 'lucide-react';
import { formatDate } from '@mcteb/shared';

export function MyRentalsPage() {
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiptRental, setReceiptRental] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    async function fetchRentals() {
      try {
        const data = await apiRequest<any[]>('/rentals');
        setRentals(data);
      } catch (err) {
        console.error('Failed to load rentals', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRentals();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          My Active & Past Equipment Loans
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Keep track of due dates, equipment conditions, and inspection status.
        </p>
      </div>

      {rentals.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-12 w-12 text-slate-400 stroke-1" />}
          title="No loan records"
          description="You do not currently have any active tool loans or past borrowing history."
          actionText="Browse Catalog"
          onAction={() => (window.location.href = '/catalog')}
        />
      ) : (
        <div className="space-y-4">
          {rentals.map((rental) => {
            const isPastDue =
              rental.status === 'Borrowed' && new Date(rental.due_date) < new Date();

            return (
              <Card key={rental.id}>
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-700/50 p-2 flex items-center justify-center flex-shrink-0">
                      <img
                        src={rental.tool_image_url || '/equipment/fallback.svg'}
                        alt={rental.tool_name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/equipment/fallback.svg';
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                          {rental.tool_name}
                        </h3>
                        <Badge status={rental.status} />
                        {isPastDue && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> PAST DUE
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Quantity: {rental.quantity} unit(s) &bull; Due Date:{' '}
                        <strong>{formatDate(rental.due_date)}</strong>
                      </p>

                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Condition: Released as <strong>{rental.initial_condition}</strong>
                        {rental.returned_condition && ` → Returned as ${rental.returned_condition}`}
                      </p>

                      {rental.inspection_notes && (
                        <p className="text-xs text-slate-500 italic">
                          Staff notes: "{rental.inspection_notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 self-end md:self-center">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Reference ID</p>
                      <p className="text-xs font-mono text-slate-700 dark:text-slate-300">
                        {rental.id.slice(0, 8)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setReceiptRental(rental)}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Borrowing Receipt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ToolBorrowingReceiptModal
        isOpen={!!receiptRental}
        onClose={() => setReceiptRental(null)}
        source={receiptRental}
      />
    </div>
  );
}
