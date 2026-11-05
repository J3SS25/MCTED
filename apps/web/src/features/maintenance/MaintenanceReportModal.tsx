import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import type { Tool, MaintenanceSeverity } from '@mcteb/shared';

const SEVERITIES: Array<{ value: MaintenanceSeverity; label: string }> = [
  { value: 'Minor', label: 'Minor (Wear & tear, cosmetic, routine oiling)' },
  { value: 'Moderate', label: 'Moderate (Part replacement needed)' },
  { value: 'Severe', label: 'Severe (Engine / motor breakdown)' },
  { value: 'Critical', label: 'Critical (Safety hazard - decommission immediately)' },
];

interface MaintenanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MaintenanceReportModal({ isOpen, onClose, onSuccess }: MaintenanceReportModalProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedToolId, setSelectedToolId] = useState('');
  const [severity, setSeverity] = useState<MaintenanceSeverity>('Moderate');
  const [description, setDescription] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [estimatedCostPesos, setEstimatedCostPesos] = useState<number>(0);
  const [scheduledDate, setScheduledDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTools() {
      try {
        const res = await apiRequest<{ items: Tool[]; total: number }>('/tools?limit=100');
        setTools(res.items);
        if (res.items.length > 0 && !selectedToolId) {
          setSelectedToolId(res.items[0]!.id);
        }
      } catch (err) {
        console.error('Failed to load tools for maintenance', err);
      }
    }
    if (isOpen) {
      loadTools();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await apiRequest('/maintenance', {
        method: 'POST',
        body: JSON.stringify({
          tool_id: selectedToolId,
          issue_description: description,
          severity,
          technician_name: technicianName || undefined,
          estimated_cost_centavos: Math.round(estimatedCostPesos * 100),
          scheduled_date: scheduledDate || undefined,
        }),
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create maintenance report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Tool Issue / Maintenance">
      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Equipment Item"
          options={tools.map((t) => ({ value: t.id, label: `${t.name} (${t.category})` }))}
          value={selectedToolId}
          onChange={(e) => setSelectedToolId(e.target.value)}
        />

        <Select
          label="Issue Severity"
          options={SEVERITIES}
          value={severity}
          onChange={(e) => setSeverity(e.target.value as MaintenanceSeverity)}
        />

        <Input
          label="Issue Description"
          required
          placeholder="e.g. Engine carburetor sputtering under load; pull cord jammed"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Assigned Technician"
            placeholder="e.g. Basco Motorpool / Engr. Gari"
            value={technicianName}
            onChange={(e) => setTechnicianName(e.target.value)}
          />

          <Input
            label="Est. Repair Cost (₱)"
            type="number"
            min="0"
            value={estimatedCostPesos}
            onChange={(e) => setEstimatedCostPesos(Number(e.target.value))}
          />
        </div>

        <Input
          label="Scheduled Repair Date"
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
        />

        <p className="text-xs text-amber-600 dark:text-amber-400">
          Note: If severity is Severe or Critical, the item will automatically be taken out of public catalog availability.
        </p>

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            Create Ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
}

