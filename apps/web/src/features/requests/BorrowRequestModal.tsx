import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { formatPHP, formatDate } from '@mcteb/shared';
import type { Tool, BorrowRequest } from '@mcteb/shared';
import { Calendar, AlertCircle, Info, ShieldCheck, Clock } from 'lucide-react';

export interface BorrowRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool?: Tool | null;
  onSuccess?: (newRequest: BorrowRequest) => void;
}

export function BorrowRequestModal({
  isOpen,
  onClose,
  tool: initialTool,
  onSuccess,
}: BorrowRequestModalProps) {
  const { user } = useAuth();

  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [selectedToolId, setSelectedToolId] = useState<string>(initialTool?.id || '');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(initialTool || null);

  const todayStr = new Date().toISOString().split('T')[0] ?? '';
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const tomorrowStr = tomorrow.toISOString().split('T')[0] ?? '';

  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(tomorrowStr);
  const [requestMessage, setRequestMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If initialTool is not provided, load available tools for selection
  useEffect(() => {
    if (isOpen && !initialTool) {
      apiRequest<{ items: Tool[] }>('/tools')
        .then((res) => {
          const activeTools = (res.items || []).filter(
            (t) => t.availability_status === 'Available' && t.available_quantity > 0,
          );
          setAvailableTools(activeTools);
          if (activeTools.length > 0 && !selectedToolId) {
            const firstTool = activeTools[0];
            if (firstTool) {
              setSelectedToolId(firstTool.id);
              setSelectedTool(firstTool);
            }
          }
        })
        .catch((err) => {
          console.error('Failed to load equipment catalog', err);
        });
    }
  }, [isOpen, initialTool, selectedToolId]);

  useEffect(() => {
    if (initialTool) {
      setSelectedToolId(initialTool.id);
      setSelectedTool(initialTool);
    }
  }, [initialTool]);

  // Update selectedTool when selectedToolId changes
  const handleToolChange = (toolId: string) => {
    setSelectedToolId(toolId);
    const found = availableTools.find((t) => t.id === toolId) || null;
    setSelectedTool(found);
    setErrorMessage(null);
  };

  // Calculate rental duration in days
  const calculateDays = (): number => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive of start & end day
    return diffDays > 0 ? diffDays : 1;
  };

  const rentalDays = calculateDays();
  const dailyRate = selectedTool?.daily_rate_centavos || selectedTool?.rental_fee_centavos || 0;
  const estimatedRentalTotal = dailyRate * rentalDays;
  const depositFee = selectedTool?.deposit_fee_centavos || 0;

  // Self-borrow verification: Check if current user owns this tool
  const isOwner = Boolean(
    user && selectedTool && selectedTool.user_id && selectedTool.user_id === user.id,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedTool) {
      setErrorMessage('Please select a valid tool or equipment to borrow.');
      return;
    }

    // Business Rule 1: No self-borrowing
    if (isOwner) {
      setErrorMessage('Business Rule Violation: You cannot borrow your own equipment listing.');
      return;
    }

    // Business Rule 2: Date logic
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date(todayStr || new Date().toISOString().slice(0, 10));

    if (start < today) {
      setErrorMessage('Start date cannot be set in the past.');
      return;
    }

    if (end < start) {
      setErrorMessage('End date must be on or after the start date.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest<BorrowRequest>('/requests', {
        method: 'POST',
        body: JSON.stringify({
          item_id: selectedTool.id,
          start_date: startDate,
          end_date: endDate,
          request_message: requestMessage.trim() || undefined,
        }),
      });

      setSuccessMessage('Borrow request submitted successfully! Awaiting review.');
      if (onSuccess) {
        onSuccess(response);
      }
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
        setRequestMessage('');
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to submit borrow request. Please check equipment availability.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Equipment Borrow Request"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <Alert variant="error">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          </Alert>
        )}

        {/* Self-Borrow Prevention Warning */}
        {isOwner && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Ownership Rule Enforcement</p>
              <p className="mt-0.5">
                You are registered as the owner of this equipment. Municipal regulations strictly
                forbid submitting borrow requests for your own items.
              </p>
            </div>
          </div>
        )}

        {/* Equipment Selector (if not pre-locked) */}
        {!initialTool ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Community Tool / Equipment <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedToolId}
              onChange={(e) => handleToolChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-deep"
              required
            >
              {availableTools.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category}) — {formatPHP(t.daily_rate_centavos || t.rental_fee_centavos)}/day
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {/* Selected Tool Preview Card */}
        {selectedTool && (
          <div className="flex items-center gap-4 p-3.5 bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="w-16 h-16 rounded-lg bg-white dark:bg-slate-800 p-2 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700">
              <img
                src={selectedTool.image_url || '/equipment/fallback.svg'}
                alt={selectedTool.name}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/equipment/fallback.svg';
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {selectedTool.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Category: <span className="font-medium text-slate-700 dark:text-slate-300">{selectedTool.category}</span>
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                {formatPHP(dailyRate)} / day &bull; Deposit: {formatPHP(depositFee)}
              </p>
            </div>
          </div>
        )}

        {/* Date Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Borrow Start Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="date"
                min={todayStr}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">First day of tool usage</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Expected Return Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="date"
                min={startDate || todayStr}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Due back at Municipal Tool Bank</p>
          </div>
        </div>

        {/* Financial Summary & Duration Notice */}
        <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-civic-accent" />
              Duration:
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {rentalDays} {rentalDays === 1 ? 'day' : 'days'} ({formatDate(startDate)} &ndash; {formatDate(endDate)})
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>Daily Equipment Fee:</span>
            <span>{formatPHP(dailyRate)} &times; {rentalDays}</span>
          </div>

          <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Estimated Rental Subtotal:
            </span>
            <span className="text-base font-extrabold text-civic-forest dark:text-civic-light">
              {formatPHP(estimatedRentalTotal)}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1">
            * Refundable deposit of {formatPHP(depositFee)} applies upon physical turnover at the municipal desk.
          </p>
        </div>

        {/* Request Message / Usage Purpose */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Intended Usage / Message to Item Owner (Optional)
          </label>
          <textarea
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Describe your intended civic, farming, or home repair project in Basco..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-deep resize-none placeholder:text-slate-400"
          />
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
            <span>Helps municipal staff and lenders expedite review.</span>
            <span>{requestMessage.length}/500</span>
          </div>
        </div>

        {/* Compliance Notice */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Info className="h-4 w-4 text-civic-accent flex-shrink-0" />
          <span>
            By submitting, you agree to the MCTEB equipment stewardship guidelines and confirm residency in Basco, Batanes.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isOwner || isSubmitting || !selectedTool}
          >
            Submit Borrow Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
