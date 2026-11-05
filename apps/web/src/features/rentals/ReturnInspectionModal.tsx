import React, { useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Select, Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import type { ToolConditionStatus } from '@mcteb/shared';
import { formatPHP } from '@mcteb/shared';

const CONDITION_OPTIONS: Array<{ value: ToolConditionStatus; label: string }> = [
  { value: 'Excellent', label: 'Excellent - Like new' },
  { value: 'Good', label: 'Good - Normal wear and tear' },
  { value: 'Fair', label: 'Fair - Heavy usage signs' },
  { value: 'Needs Repair', label: 'Needs Repair - Damaged components' },
  { value: 'Under Maintenance', label: 'Under Maintenance - Broken' },
];

interface ReturnInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: any;
  onSuccess: () => void;
}

export function ReturnInspectionModal({ isOpen, onClose, rental, onSuccess }: ReturnInspectionModalProps) {
  const [returnedCondition, setReturnedCondition] = useState<ToolConditionStatus>('Good');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [damagePenaltyPesos, setDamagePenaltyPesos] = useState<number>(0);
  const [overduePenaltyPesos, setOverduePenaltyPesos] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiRequest(`/rentals/${rental.id}/return`, {
        method: 'POST',
        body: JSON.stringify({
          returned_condition: returnedCondition,
          inspection_notes: inspectionNotes,
          overdue_penalty_centavos: Math.round(overduePenaltyPesos * 100),
          damage_penalty_centavos: Math.round(damagePenaltyPesos * 100),
        }),
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to process tool return');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Inspect Return: ${rental?.tool_name}`}>
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Borrower: <strong>{rental?.borrower_name}</strong> &bull; Initial condition was{' '}
          <strong>{rental?.initial_condition}</strong>.
        </p>

        <Select
          label="Returned Equipment Condition"
          options={CONDITION_OPTIONS}
          value={returnedCondition}
          onChange={(e) => setReturnedCondition(e.target.value as ToolConditionStatus)}
        />

        <Input
          label="Inspection Remarks"
          placeholder="Cleaned, blade inspected, cables untangled"
          value={inspectionNotes}
          onChange={(e) => setInspectionNotes(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Overdue Penalty (₱)"
            type="number"
            min="0"
            step="1"
            value={overduePenaltyPesos}
            onChange={(e) => setOverduePenaltyPesos(Number(e.target.value))}
          />

          <Input
            label="Damage Penalty (₱)"
            type="number"
            min="0"
            step="1"
            value={damagePenaltyPesos}
            onChange={(e) => setDamagePenaltyPesos(Number(e.target.value))}
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            Accept Return & Update Inventory
          </Button>
        </div>
      </form>
    </Modal>
  );
}

