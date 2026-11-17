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
import { CreditCard, Receipt, PlusCircle, Download } from 'lucide-react';
import { downloadReceiptPdf } from '../../lib/pdf-receipt';
import {
  DEMO_PAYMENT_METHODS,
  formatPHP,
  formatDate,
  type PaymentStatus,
  type Tool,
} from '@mcteb/shared';

const PAYMENT_METHODS = [
  ...DEMO_PAYMENT_METHODS.map((m) => ({ value: m, label: `${m} (Demo)` })),
  { value: 'Cash', label: 'Cash (Municipal Hall Counter)' },
];

export function MyPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Submit payment modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedToolId, setSelectedToolId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [durationDays, setDurationDays] = useState(1);
  const [amountPesos, setAmountPesos] = useState('150');
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [simulatedStatus, setSimulatedStatus] = useState<PaymentStatus>('Paid');
  const [pickupDate, setPickupDate] = useState(() => new Date().toISOString().split('T')[0]!);
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0]!;
  });
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      const [payData, toolRes] = await Promise.all([
        apiRequest<any[]>('/payments'),
        apiRequest<{ items: Tool[] }>('/tools?limit=100').catch(() => ({ items: [] })),
      ]);
      setPayments(payData);
      setTools(toolRes.items || []);
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
      const selectedTool = tools.find((t) => t.id === selectedToolId);
      const amountCentavos = Math.round(Number(amountPesos) * 100);
      const itemsJson = selectedTool
        ? JSON.stringify([
            {
              tool_id: selectedTool.id,
              tool_name: selectedTool.name,
              category: selectedTool.category,
              quantity: Math.max(1, Number(quantity)),
              unit_cost_centavos: selectedTool.rental_fee_centavos,
              deposit_fee_centavos: selectedTool.deposit_fee_centavos,
              duration_days: Math.max(1, Number(durationDays)),
              subtotal_centavos: amountCentavos,
            },
          ])
        : undefined;

      const created = await apiRequest<any>('/payments', {
        method: 'POST',
        body: JSON.stringify({
          tool_id: selectedToolId || undefined,
          amount_centavos: amountCentavos,
          payment_method: paymentMethod,
          status: simulatedStatus,
          items_json: itemsJson,
          pickup_date: pickupDate || undefined,
          return_date: returnDate || undefined,
          duration_days: Math.max(1, Number(durationDays)),
          remarks: remarks.trim() || `Demo transaction via ${paymentMethod}`,
        }),
      });

      setIsSubmitModalOpen(false);
      setRemarks('');
      await fetchPayments();
      setSelectedReceipt(created);
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
            Track transactions, simulate demo payments (GCash, LANDBANK, Maya, BDO), and print or
            download PDF receipts.
          </p>
        </div>

        <Button
          onClick={() => setIsSubmitModalOpen(true)}
          className="gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" /> Simulate Demo Payment
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {payment.receipt_reference}
                    </span>
                    <Badge status={payment.status} />
                  </div>

                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {formatPHP(payment.amount_centavos)} &bull; {payment.payment_method}
                    {payment.tool_name && (
                      <span className="font-normal text-slate-600 dark:text-slate-300">
                        {' '}
                        &bull; {payment.tool_name}
                      </span>
                    )}
                  </p>

                  <p className="text-xs text-slate-500">
                    Submitted: {formatDate(payment.created_at)}
                    {payment.verified_at && ` | Processed: ${formatDate(payment.verified_at)}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5"
                    onClick={() => downloadReceiptPdf(payment)}
                  >
                    <Download className="h-4 w-4" /> PDF
                  </Button>
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

      {/* Record / Simulate Demo Payment Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Demo Payment Transaction"
        maxWidth="lg"
      >
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <Alert variant="info" className="mb-4">
          For testing/demo purposes only — simulates payment method selection and status without
          real payment gateway integration.
        </Alert>

        <form onSubmit={handleRecordPayment} className="space-y-4">
          <Select
            label="Equipment Item (Optional)"
            options={[
              { value: '', label: 'General Municipal Equipment Fee' },
              ...tools.map((t) => ({
                value: t.id,
                label: `${t.name} (${formatPHP(t.rental_fee_centavos)}/day)`,
              })),
            ]}
            value={selectedToolId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedToolId(id);
              const found = tools.find((t) => t.id === id);
              if (found) {
                const totalCentavos =
                  found.rental_fee_centavos * quantity * durationDays +
                  found.deposit_fee_centavos * quantity;
                setAmountPesos(String(Math.max(1, totalCentavos / 100)));
              }
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Amount (₱)"
              type="number"
              min="1"
              step="0.01"
              required
              value={amountPesos}
              onChange={(e) => setAmountPesos(e.target.value)}
            />
            <Input
              label="Quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
            <Input
              label="Duration (Days)"
              type="number"
              min="1"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Payment Method (Demo)"
              options={PAYMENT_METHODS}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />

            <Select
              label="Simulated Status"
              options={[
                { value: 'Paid', label: 'Paid (Demo Approved)' },
                { value: 'Pending', label: 'Pending (For Staff Verification)' },
                { value: 'Failed', label: 'Failed (Simulate Declined)' },
              ]}
              value={simulatedStatus}
              onChange={(e) => setSimulatedStatus(e.target.value as PaymentStatus)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Pickup Date"
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
            />
            <Input
              label="Return Schedule Date"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>

          <Input
            label="Remarks / Notes"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional project note or demo reference"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Process Demo Payment
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
