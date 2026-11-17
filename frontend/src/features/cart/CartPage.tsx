import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { useWishlistCart } from '../../lib/wishlist-cart-context';
import { resolveToolImage } from '../../lib/local-storage';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { OfficialReceiptModal } from '../payments/OfficialReceiptModal';
import type { PaymentReceiptSource } from '../../lib/pdf-receipt';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Heart,
  CreditCard,
  Smartphone,
  Landmark,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  DEMO_PAYMENT_METHODS,
  formatPHP,
  type PaymentMethod,
  type PaymentStatus,
  type ReceiptItem,
} from '@mcteb/shared';

const DEMO_PAYMENT_DETAILS: Record<
  (typeof DEMO_PAYMENT_METHODS)[number],
  { subtitle: string; badge: string; placeholder: string; icon: React.ReactNode }
> = {
  GCash: {
    subtitle: 'Instant E-Wallet Simulation',
    badge: 'Mobile Wallet',
    placeholder: '0917-123-4567',
    icon: <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
  },
  LANDBANK: {
    subtitle: 'Link.BizPortal Government Demo',
    badge: 'State Bank',
    placeholder: '3402-1029-4810',
    icon: <Landmark className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
  },
  'Maya (PayMaya)': {
    subtitle: 'Digital Wallet & QR Simulation',
    badge: 'E-Wallet',
    placeholder: '0918-555-0192',
    icon: <Smartphone className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
  },
  BDO: {
    subtitle: 'Online Banking Transfer Demo',
    badge: 'Commercial Bank',
    placeholder: '0045-8012-3391',
    icon: <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
  },
};

export function CartPage() {
  const { user } = useAuth();
  const { cart, wishlist, updateCartQuantity, removeFromCart, clearCart } = useWishlistCart();
  const navigate = useNavigate();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0]!;

  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0]!;

  const [pickupDate, setPickupDate] = useState(tomorrowStr);
  const [returnDate, setReturnDate] = useState(threeDaysLaterStr);
  const [remarks, setRemarks] = useState('');
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof DEMO_PAYMENT_METHODS)[number]>('GCash');
  const [accountRef, setAccountRef] = useState('0917-123-4567');
  const [simulatedStatus, setSimulatedStatus] = useState<PaymentStatus>('Paid');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedReceipt, setGeneratedReceipt] = useState<PaymentReceiptSource | null>(null);

  const durationDays = Math.max(
    1,
    Math.ceil(
      (new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24),
    ) + 1,
  );

  const lineItems: ReceiptItem[] = cart.map(({ tool, quantity }) => {
    const discount = tool.discount_percent ?? 0;
    const effectiveDailyRate =
      discount > 0
        ? Math.round(tool.rental_fee_centavos * (1 - discount / 100))
        : tool.rental_fee_centavos;
    const rentalTotal = effectiveDailyRate * quantity * durationDays;
    const depositTotal = tool.deposit_fee_centavos * quantity;
    return {
      tool_id: tool.id,
      tool_name: tool.name,
      category: tool.category,
      quantity,
      unit_cost_centavos: effectiveDailyRate,
      deposit_fee_centavos: depositTotal,
      duration_days: durationDays,
      subtotal_centavos: rentalTotal + depositTotal,
    };
  });

  const totalRentalCentavos = lineItems.reduce(
    (sum, i) => sum + i.unit_cost_centavos * i.quantity * i.duration_days,
    0,
  );
  const totalDepositCentavos = lineItems.reduce((sum, i) => sum + i.deposit_fee_centavos, 0);
  const grandTotalCentavos = Math.max(100, totalRentalCentavos + totalDepositCentavos);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      navigate('/login', { state: { from: { pathname: '/cart' } } });
      return;
    }

    if (new Date(pickupDate) > new Date(returnDate)) {
      setError('Return date must be on or after the pickup date.');
      return;
    }

    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setSubmitting(true);
    try {
      let primaryReservationId: string | undefined;

      // Create reservation requests for each cart item
      for (const item of cart) {
        const res = await apiRequest<{ id: string }>('/reservations', {
          method: 'POST',
          body: JSON.stringify({
            tool_id: item.tool.id,
            quantity: item.quantity,
            pickup_date: pickupDate,
            return_date: returnDate,
            purpose: remarks.trim() || `Cart checkout (${paymentMethod} demo)`,
          }),
        });
        if (!primaryReservationId) {
          primaryReservationId = res.id;
        }
      }

      // Record simulated demo payment with itemized receipt payload
      const payment = await apiRequest<any>('/payments', {
        method: 'POST',
        body: JSON.stringify({
          reservation_id: primaryReservationId,
          tool_id: cart[0]?.tool.id,
          amount_centavos: grandTotalCentavos,
          payment_method: paymentMethod as PaymentMethod,
          status: simulatedStatus,
          items_json: JSON.stringify(lineItems),
          pickup_date: pickupDate,
          return_date: returnDate,
          duration_days: durationDays,
          remarks:
            [remarks.trim(), accountRef.trim() ? `Demo Account Ref: ${accountRef.trim()}` : '']
              .filter(Boolean)
              .join(' | ') || `Demo checkout via ${paymentMethod}`,
        }),
      });

      clearCart();
      setGeneratedReceipt(payment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed. Please verify availability.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Borrowing Cart & Demo Checkout
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review requested tools, select borrowing dates, simulate payment, and generate your
            official receipt.
          </p>
        </div>

        {wishlist.length > 0 && (
          <Link to="/wishlist">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Heart className="h-4 w-4 text-rose-500" /> View Wishlist ({wishlist.length})
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {cart.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-12 w-12 text-slate-400 stroke-1" />}
          title="Your borrowing cart is empty"
          description="Add tools from the Equipment Catalog or move saved items from your Wishlist."
          actionText="Browse Catalog"
          onAction={() => navigate('/catalog')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map(({ tool, quantity }) => {
              const discount = tool.discount_percent ?? 0;
              const effectiveDailyRate =
                discount > 0
                  ? Math.round(tool.rental_fee_centavos * (1 - discount / 100))
                  : tool.rental_fee_centavos;
              const itemTotal =
                effectiveDailyRate * quantity * durationDays + tool.deposit_fee_centavos * quantity;
              const maxQty = Math.max(1, tool.available_quantity || tool.total_quantity);

              return (
                <Card key={tool.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-700/60 p-1.5 flex items-center justify-center flex-shrink-0">
                        <img
                          src={resolveToolImage(tool)}
                          alt={tool.name}
                          className="max-h-full max-w-full object-contain rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/equipment/fallback.svg';
                          }}
                        />
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <p className="text-[11px] font-semibold text-civic-deep dark:text-civic-light uppercase">
                          {tool.category}
                        </p>
                        <Link to={`/catalog/${tool.id}`} className="hover:underline">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {tool.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-slate-500">
                          {formatPHP(effectiveDailyRate)}/day &bull; Deposit:{' '}
                          {formatPHP(tool.deposit_fee_centavos)}/unit
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(tool.id, quantity - 1)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold">{quantity}</span>
                        <button
                          type="button"
                          disabled={quantity >= maxQty}
                          onClick={() => updateCartQuantity(tool.id, quantity + 1)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[90px]">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {formatPHP(itemTotal)}
                        </p>
                        <p className="text-[10px] text-slate-400">{durationDays} day(s)</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(tool.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                        aria-label={`Remove ${tool.name} from cart`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Checkout & Demo Payment Panel */}
          <Card className="sticky top-20">
            <CardContent className="p-5 space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Schedule & Demo Payment
                </h3>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5 mt-2">
                  Testing / Demo Purposes Only — No real payment gateway or real money is charged.
                </p>
              </div>

              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Pickup Date"
                    type="date"
                    required
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                  <Input
                    label="Return Date"
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Select Payment Method (Demo)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DEMO_PAYMENT_METHODS.map((method) => {
                      const info = DEMO_PAYMENT_DETAILS[method];
                      const selected = paymentMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(method);
                            setAccountRef(info.placeholder);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            selected
                              ? 'border-civic-forest bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-civic-accent/40'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            {info.icon}
                            {selected && (
                              <CheckCircle2 className="h-4 w-4 text-civic-forest dark:text-civic-light" />
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {method}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {info.badge}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Input
                  label={`${paymentMethod} Demo Account / Mobile`}
                  value={accountRef}
                  onChange={(e) => setAccountRef(e.target.value)}
                  placeholder={DEMO_PAYMENT_DETAILS[paymentMethod].placeholder}
                />

                <Select
                  label="Simulate Transaction Status"
                  options={[
                    { value: 'Paid', label: 'Paid (Instant Demo Confirmation)' },
                    { value: 'Pending', label: 'Pending (Treasury Verification)' },
                    { value: 'Failed', label: 'Failed (Simulate Declined)' },
                  ]}
                  value={simulatedStatus}
                  onChange={(e) => setSimulatedStatus(e.target.value as PaymentStatus)}
                />

                <Input
                  label="Project Purpose / Remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Barangay garden irrigation / home repairs"
                />

                {/* Totals */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Borrowing Duration:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {durationDays} day(s)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Rental Fees Subtotal:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatPHP(totalRentalCentavos)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Refundable Deposits:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatPHP(totalDepositCentavos)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-bold text-civic-forest dark:text-civic-light">
                    <span>Total Amount:</span>
                    <span>{formatPHP(grandTotalCentavos)}</span>
                  </div>
                </div>

                <Button type="submit" isLoading={submitting} className="w-full gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  {user ? 'Complete Checkout & Generate Receipt' : 'Sign In to Checkout'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Receipt Modal */}
      {generatedReceipt && (
        <OfficialReceiptModal
          isOpen={!!generatedReceipt}
          onClose={() => {
            setGeneratedReceipt(null);
            navigate('/my-payments');
          }}
          payment={generatedReceipt}
        />
      )}
    </div>
  );
}
