import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Check, X, CalendarCheck } from 'lucide-react';
import { formatDate } from '@mcteb/shared';

export function ReservationQueuePage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('Pending');

  // Review modal state
  const [selectedRes, setSelectedRes] = useState<any | null>(null);
  const [decision, setDecision] = useState<'Approved' | 'Rejected'>('Approved');
  const [staffNotes, setStaffNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const url = filterStatus ? `/reservations?status=${filterStatus}` : '/reservations';
      const data = await apiRequest<any[]>(url);
      setReservations(data);
    } catch (err) {
      console.error('Failed to load reservation queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [filterStatus]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRes) return;
    setSubmitting(true);

    try {
      await apiRequest(`/reservations/${selectedRes.id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({
          decision,
          staff_notes: staffNotes,
        }),
      });

      setMessage(`Reservation was successfully ${decision.toLowerCase()}.`);
      setSelectedRes(null);
      setStaffNotes('');
      await fetchQueue();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Review action failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Municipal Reservation Queue
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review resident equipment requests and verify dates and inventory.
          </p>
        </div>

        <div className="w-full sm:w-48">
          <Select
            label="Filter Status"
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'Pending', label: 'Pending Only' },
              { value: 'Approved', label: 'Approved Only' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Rejected', label: 'Rejected' },
              { value: 'Cancelled', label: 'Cancelled' },
            ]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          />
        </div>
      </div>

      {message && <Alert variant="success">{message}</Alert>}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-12 w-12 text-slate-400 stroke-1" />}
          title="Queue is empty"
          description={`No reservations found with status "${filterStatus || 'all'}"`}
        />
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => (
            <Card key={res.id}>
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {res.tool_name}
                    </h3>
                    <Badge status={res.status} />
                    <span className="text-xs text-slate-400 font-mono">ID: {res.id.slice(0, 8)}</span>
                  </div>

                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    Borrower: <span className="font-semibold text-civic-deep dark:text-civic-light">{res.borrower_name}</span> &bull; Brgy. {res.borrower_barangay} &bull; {res.borrower_phone}
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dates: <strong>{formatDate(res.pickup_date)}</strong> to <strong>{formatDate(res.return_date)}</strong> ({res.quantity} unit)
                  </p>

                  {res.purpose && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      Project Purpose: "{res.purpose}"
                    </p>
                  )}

                  {res.staff_notes && (
                    <p className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700/60 p-2 rounded">
                      Staff Note: {res.staff_notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  {res.status === 'Pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        className="gap-1.5"
                        onClick={() => {
                          setSelectedRes(res);
                          setDecision('Approved');
                        }}
                      >
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        className="gap-1.5"
                        onClick={() => {
                          setSelectedRes(res);
                          setDecision('Rejected');
                        }}
                      >
                        <X className="h-4 w-4" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Decision Modal */}
      {selectedRes && (
        <Modal
          isOpen={!!selectedRes}
          onClose={() => setSelectedRes(null)}
          title={`${decision} Reservation Request`}
        >
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              You are about to mark this request for <strong>{selectedRes.tool_name}</strong> by <strong>{selectedRes.borrower_name}</strong> as <Badge status={decision} />.
            </p>

            <Input
              label="Staff Decision Notes / Reason"
              placeholder={decision === 'Approved' ? 'Verified ID and safety equipment' : 'Reason for rejection (e.g. maintenance conflict)'}
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              required={decision === 'Rejected'}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedRes(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={decision === 'Approved' ? 'primary' : 'danger'}
                isLoading={submitting}
              >
                Confirm {decision}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

