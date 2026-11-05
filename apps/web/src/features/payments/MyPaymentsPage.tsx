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
import { CreditCard, Receipt, PlusCircle } from 'lucide-react';
import { formatPHP, formatDate } from '@mcteb/shared';

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash (Municipal Hall Counter)' },
  { value: 'GCash', label: 'GCash' },
  { value: 'Bank Transfer', label: 'Land Bank Transfer' },
  { value: 'Municipal Treasury', label: 'Municipal Treasury Assessment' },
];

export function MyPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Submit payment modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [amountPesos, setAmountPesos] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      const data = await apiRequest<any[]>('/payments');
      setPayments(data);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiRequest('/payments', {
        method: 'POST',
        body: JSON.stringify({
          amount_centavos: Math.round(Number(amountPesos) * 100),
          payment_method: paymentMethod,
        }),
      });

      setIsSubmitModalOpen(false);
      setAmountPesos('');
      await fetchPayments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Payments & Official Receipts
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track rental fee payments and download municipal receipts.
          </p>
        </div>

        <Button onClick={() => setIsSubmitModalOpen(true)} className="gap-2 self-start sm:self-auto">
          <PlusCircle className="h-4 w-4" /> Record New Payment
        </Button>
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-12 w-12 text-slate-400 stroke-1" />}
          title="No payments recorded"
          description="You do not have any recorded rental fee transactions yet."
        />
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {payment.receipt_reference}
                    </span>
                    <Badge status={payment.status} />
                  </div>

                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {formatPHP(payment.amount_centavos)} &bull; {payment.payment_method}
                  </p>

                  <p className="text-xs text-slate-500">
                    Submitted: {formatDate(payment.created_at)}
                    {payment.verified_at && ` | Verified on ${formatDate(payment.verified_at)}`}
                  </p>
                </div>

                <div className="self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setSelectedReceipt(payment)}
                  >
                    <Receipt className="h-4 w-4" /> View Receipt
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Record Fee Payment"
      >
        {error && <Alert variant="error" className="mb-4">{error}</Alert>}

        <form onSubmit={handleRecordPayment} className="space-y-4">
          <Input
            label="Payment Amount (₱)"
            type="number"
            min="1"
            step="0.01"
            required
            value={amountPesos}
            onChange={(e) => setAmountPesos(e.target.value)}
            placeholder="150.00"
          />

          <Select
            label="Payment Method"
            options={PAYMENT_METHODS}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />

          <p className="text-xs text-slate-500">
            Note: Your payment reference will be submitted to the Municipal Treasury staff for verification.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Submit for Verification
            </Button>
          </div>
        </form>
      </Modal>

      {/* Official Receipt Modal */}
      {selectedReceipt && (
        <OfficialReceiptModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          payment={selectedReceipt}
        />
      )}
    </div>
  );
}

