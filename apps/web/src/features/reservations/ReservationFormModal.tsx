import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import type { Tool } from '@mcteb/shared';
import { formatPHP } from '@mcteb/shared';

interface ReservationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: Tool;
}

export function ReservationFormModal({ isOpen, onClose, tool }: ReservationFormModalProps) {
  const navigate = useNavigate();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0]!;

  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0]!;

  const [pickupDate, setPickupDate] = useState(tomorrowStr);
  const [returnDate, setReturnDate] = useState(threeDaysLaterStr);
  const [quantity, setQuantity] = useState(1);
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate estimated days & fee
  const days = Math.max(
    1,
    Math.ceil((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );
  const estimatedRentalTotal = tool.rental_fee_centavos * days * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiRequest('/reservations', {
        method: 'POST',
        body: JSON.stringify({
          tool_id: tool.id,
          quantity,
          pickup_date: pickupDate,
          return_date: returnDate,
          purpose,
        }),
      });

      onClose();
      navigate('/my-reservations');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to submit reservation request');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reserve ${tool.name}`}>
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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

        <Input
          label="Quantity Needed"
          type="number"
          min="1"
          max={tool.available_quantity}
          required
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          helperText={`Maximum available right now: ${tool.available_quantity}`}
        />

        <Input
          label="Intended Project / Purpose"
          required
          placeholder="e.g. Garden irrigation / home repair / boat maintenance"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />

        {/* Estimated Fee Summary */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs space-y-1.5 border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Duration:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{days} day(s)</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Estimated Rental Fee:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{formatPHP(estimatedRentalTotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Refundable Deposit:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{formatPHP(tool.deposit_fee_centavos * quantity)}</span>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            Submit Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}

