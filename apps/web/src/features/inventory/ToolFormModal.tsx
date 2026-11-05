import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import type { Tool, ToolAvailabilityStatus, ToolConditionStatus } from '@mcteb/shared';

const CATEGORIES = [
  { value: 'Agriculture', label: 'Agriculture' },
  { value: 'Fishing', label: 'Fishing' },
  { value: 'Carpentry', label: 'Carpentry' },
  { value: 'Construction', label: 'Construction' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Emergency Response', label: 'Emergency Response' },
];

const AVAILABILITY_STATUSES: Array<{ value: ToolAvailabilityStatus; label: string }> = [
  { value: 'Available', label: 'Available' },
  { value: 'Reserved', label: 'Reserved' },
  { value: 'Borrowed', label: 'Borrowed' },
  { value: 'Returned', label: 'Returned' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'Damaged', label: 'Damaged' },
  { value: 'Archived', label: 'Archived' },
];

const CONDITION_STATUSES: Array<{ value: ToolConditionStatus; label: string }> = [
  { value: 'Excellent', label: 'Excellent' },
  { value: 'Good', label: 'Good' },
  { value: 'Fair', label: 'Fair' },
  { value: 'Needs Repair', label: 'Needs Repair' },
  { value: 'Under Maintenance', label: 'Under Maintenance' },
];

interface ToolFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool?: Tool | null;
  onSuccess: () => void;
}

export function ToolFormModal({ isOpen, onClose, tool, onSuccess }: ToolFormModalProps) {
  const isEditing = !!tool;

  const [formData, setFormData] = useState({
    name: '',
    category: 'Agriculture',
    description: '',
    specifications: '',
    rentalFeePesos: 50,
    depositFeePesos: 200,
    totalQuantity: 1,
    serialNumber: '',
    availabilityStatus: 'Available' as ToolAvailabilityStatus,
    conditionStatus: 'Good' as ToolConditionStatus,
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (tool) {
      setFormData({
        name: tool.name,
        category: tool.category,
        description: tool.description,
        specifications: tool.specifications || '',
        rentalFeePesos: tool.rental_fee_centavos / 100,
        depositFeePesos: tool.deposit_fee_centavos / 100,
        totalQuantity: tool.total_quantity,
        serialNumber: tool.serial_number || '',
        availabilityStatus: tool.availability_status,
        conditionStatus: tool.condition_status,
      });
    } else {
      setFormData({
        name: '',
        category: 'Agriculture',
        description: '',
        specifications: '',
        rentalFeePesos: 50,
        depositFeePesos: 200,
        totalQuantity: 1,
        serialNumber: '',
        availabilityStatus: 'Available',
        conditionStatus: 'Good',
      });
    }
  }, [tool, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        specifications: formData.specifications || undefined,
        rental_fee_centavos: Math.round(formData.rentalFeePesos * 100),
        deposit_fee_centavos: Math.round(formData.depositFeePesos * 100),
        total_quantity: Number(formData.totalQuantity),
        serial_number: formData.serialNumber || undefined,
        availability_status: formData.availabilityStatus,
        condition_status: formData.conditionStatus,
      };

      if (isEditing && tool) {
        await apiRequest(`/tools/${tool.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/tools', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Equipment: ${tool.name}` : 'Add New Equipment to Catalog'}
      maxWidth="lg"
    >
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Equipment Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Inverter Silent Generator 3.5 kVA"
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category"
            options={CATEGORIES}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />

          <Input
            label="Serial Number / Asset Tag"
            value={formData.serialNumber}
            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
            placeholder="MCTEB-EQP-001"
          />
        </div>

        <Input
          label="Description"
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Purpose, power specs, application guidelines"
        />

        <Input
          label="Technical Specifications"
          value={formData.specifications}
          onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
          placeholder="Dimensions, voltage, accessories included"
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Rental Fee / Day (₱)"
            type="number"
            min="0"
            required
            value={formData.rentalFeePesos}
            onChange={(e) => setFormData({ ...formData, rentalFeePesos: Number(e.target.value) })}
          />

          <Input
            label="Deposit (₱)"
            type="number"
            min="0"
            required
            value={formData.depositFeePesos}
            onChange={(e) => setFormData({ ...formData, depositFeePesos: Number(e.target.value) })}
          />

          <Input
            label="Total Quantity"
            type="number"
            min="1"
            required
            value={formData.totalQuantity}
            onChange={(e) => setFormData({ ...formData, totalQuantity: Number(e.target.value) })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Availability Status"
            options={AVAILABILITY_STATUSES}
            value={formData.availabilityStatus}
            onChange={(e) =>
              setFormData({ ...formData, availabilityStatus: e.target.value as ToolAvailabilityStatus })
            }
          />

          <Select
            label="Condition Status"
            options={CONDITION_STATUSES}
            value={formData.conditionStatus}
            onChange={(e) =>
              setFormData({ ...formData, conditionStatus: e.target.value as ToolConditionStatus })
            }
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            {isEditing ? 'Save Changes' : 'Create Equipment Entry'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

