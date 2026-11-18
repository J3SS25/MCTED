import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ReturnInspectionModal } from './ReturnInspectionModal';
import { ToolBorrowingReceiptModal } from '../../components/receipt/ToolBorrowingReceiptModal';
import { ArrowDownLeft, ArrowUpRight, FileText } from 'lucide-react';
import { formatDate } from '@mcteb/shared';

export function RentalDeskPage() {
  const [rentals, setRentals] = useState<any[]>([]);
  const [approvedReservations, setApprovedReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectRental, setInspectRental] = useState<any>(null);
  const [releaseLoading, setReleaseLoading] = useState<string | null>(null);
  const [receiptSource, setReceiptSource] = useState<Record<string, unknown> | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rentalsData, resData] = await Promise.all([
        apiRequest<any[]>('/rentals'),
        apiRequest<any[]>('/reservations?status=Approved'),
      ]);
      setRentals(rentalsData);
      setApprovedReservations(resData);
    } catch (err) {
      console.error('Failed to load rental desk data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleHandoverRelease = async (reservation: any) => {
    if (
      !confirm(
        `Release ${reservation.quantity} unit(s) of "${reservation.tool_name}" to ${reservation.borrower_name}?`,
      )
    ) {
      return;
    }

    setReleaseLoading(reservation.id);
    try {
      const releasedRental = await apiRequest<Record<string, unknown>>('/rentals/release', {
        method: 'POST',
        body: JSON.stringify({
          reservation_id: reservation.id,
          user_id: reservation.user_id,
          tool_id: reservation.tool_id,
          quantity: reservation.quantity,
          due_date: reservation.return_date,
          initial_condition: 'Good',
          inspection_notes: `Released pursuant to approved reservation ${reservation.id.slice(0, 8)}`,
        }),
      });

      await fetchData();
      setReceiptSource(releasedRental);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Handover release failed');
    } finally {
      setReleaseLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Municipal Tool Rental Desk
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Coordinate equipment pickup handovers and process return inspections.
          </p>
        </div>

        <Link to="/borrowing-receipt">
          <Button variant="outline" size="sm" className="gap-1.5">
            <FileText className="h-4 w-4" />
            New / Blank Receipt Form
          </Button>
        </Link>
      </div>

      {/* Section 1: Ready for Pickup (Approved Reservations) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ArrowDownLeft className="h-5 w-5 text-civic-accent" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Handovers Ready for Pickup ({approvedReservations.length})
          </h3>
        </div>

        {approvedReservations.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-xs text-slate-500">
              No approved reservations currently awaiting tool handover pickup.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedReservations.map((res) => (
              <Card key={res.id} className="border-l-4 border-l-civic-forest">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {res.tool_name}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Borrower: <strong>{res.borrower_name}</strong> (Brgy.{' '}
                        {res.borrower_barangay})
                      </p>
                    </div>
                    <Badge status="Approved" />
                  </div>

                  <div className="text-xs text-slate-500 space-y-0.5">
                    <p>Contact: {res.borrower_phone}</p>
                    <p>Expected Due: {formatDate(res.return_date)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      isLoading={releaseLoading === res.id}
                      onClick={() => handleHandoverRelease(res)}
                    >
                      Release & Complete Handover
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => setReceiptSource(res)}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Borrowing Receipt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Active & Past Equipment Loans */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5 text-blue-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Active Loans & Return Inspection (
            {rentals.filter((r) => r.status === 'Borrowed').length} Active)
          </h3>
        </div>

        {rentals.length === 0 ? (
          <EmptyState
            title="No loan records"
            description="No current active equipment loans on the municipal ledger."
          />
        ) : (
          <div className="space-y-3">
            {rentals.map((rental) => (
              <Card key={rental.id}>
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {rental.tool_name}
                      </h4>
                      <Badge status={rental.status} />
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Borrower: <strong>{rental.borrower_name}</strong> &bull; Due:{' '}
                      <strong>{formatDate(rental.due_date)}</strong>
                    </p>

                    <p className="text-xs text-slate-500">
                      Condition at Release: {rental.initial_condition}
                      {rental.returned_condition && ` | Returned: ${rental.returned_condition}`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => setReceiptSource(rental)}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Borrowing Receipt
                    </Button>
                    {rental.status === 'Borrowed' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setInspectRental(rental)}
                      >
                        Inspect & Process Return
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {inspectRental && (
        <ReturnInspectionModal
          isOpen={!!inspectRental}
          onClose={() => setInspectRental(null)}
          rental={inspectRental}
          onSuccess={fetchData}
        />
      )}

      <ToolBorrowingReceiptModal
        isOpen={!!receiptSource}
        onClose={() => setReceiptSource(null)}
        source={receiptSource}
      />
    </div>
  );
}
