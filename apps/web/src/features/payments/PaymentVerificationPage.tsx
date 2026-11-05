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
import { OfficialReceiptModal } from './OfficialReceiptModal';
import { CreditCard, Check, X, Receipt } from 'lucide-react';
import { formatPHP, formatDate } from '@mcteb/shared';

export function PaymentVerificationPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('Pending');

  // Verification modal state
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<'Paid' | 'Failed'>('Paid');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Receipt modal state
  const [viewReceipt, setViewReceipt] = useState<any | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const url = filterStatus ? `/payments?status=${filterStatus}` : '/payments';
      const data = await apiRequest<any[]>(url);
      setPayments(data);
    } catch (err) {
      console.error('Failed to load payments queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filterStatus]);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setSubmitting(true);

    try {
      await apiRequest(`/payments/${selectedPayment.id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: decisionStatus,
          notes,
        }),
      });

      setMessage(`Payment ${selectedPayment.receipt_reference} marked as ${decisionStatus}.`);
      setSelectedPayment(null);
      setNotes('');
      await fetchPayments();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Municipal Payment Verification Queue
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Verify resident payments against municipal treasury records or banking statements.
          </p>
        </div>

        <div className="w-full sm:w-48">
          <Select
            label="Filter Status"
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'Pending', label: 'Pending Only' },
              { value: 'Paid', label: 'Verified Paid' },
              { value: 'Failed', label: 'Failed' },
              { value: 'Refunded', label: 'Refunded' },
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
      ) : payments.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-12 w-12 text-slate-400 stroke-1" />}
          title="No payments in queue"
          description={`No payments currently matching status "${filterStatus || 'all'}".`}
        />
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {p.receipt_reference}
                    </span>
                    <Badge status={p.status} />
                  </div>

                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Payer: {p.payer_name} (Brgy. {p.payer_barangay}) &bull;{' '}
                    <span className="text-civic-forest dark:text-civic-light font-bold">
                      {formatPHP(p.amount_centavos)}
                    </span>
                  </p>

                  <p className="text-xs text-slate-500">
                    Method: {p.payment_method} &bull; Recorded on {formatDate(p.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setViewReceipt(p)}
                    className="gap-1"
                  >
                    <Receipt className="h-4 w-4" /> Receipt
                  </Button>

                  {p.status === 'Pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        className="gap-1.5"
                        onClick={() => {
                          setSelectedPayment(p);
                          setDecisionStatus('Paid');
                        }}
                      >
                        <Check className="h-4 w-4" /> Verify Paid
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        className="gap-1.5"
                        onClick={() => {
                          setSelectedPayment(p);
                          setDecisionStatus('Failed');
                        }}
                      >
                        <X className="h-4 w-4" /> Decline
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Verification Modal */}
      {selectedPayment && (
        <Modal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title={`Verify Payment: ${selectedPayment.receipt_reference}`}
        >
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Mark payment of <strong>{formatPHP(selectedPayment.amount_centavos)}</strong> by{' '}
              <strong>{selectedPayment.payer_name}</strong> as <Badge status={decisionStatus} />.
            </p>

            <Input
              label="Staff Notes"
              placeholder="Treasury OR Number / Bank Ref match confirmed"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedPayment(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={decisionStatus === 'Paid' ? 'primary' : 'danger'}
                isLoading={submitting}
              >
                Confirm Verification
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Official Receipt Viewer */}
      {viewReceipt && (
        <OfficialReceiptModal
          isOpen={!!viewReceipt}
          onClose={() => setViewReceipt(null)}
          payment={viewReceipt}
        />
      )}
    </div>
  );
}

