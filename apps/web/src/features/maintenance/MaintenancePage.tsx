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
import { MaintenanceReportModal } from './MaintenanceReportModal';
import { ClipboardList, PlusCircle, Wrench, CheckCircle } from 'lucide-react';
import type { MaintenanceStatus } from '@mcteb/shared';
import { formatPHP, formatDate } from '@mcteb/shared';

const STATUS_OPTIONS: Array<{ value: MaintenanceStatus; label: string }> = [
  { value: 'Reported', label: 'Reported' },
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed (Repaired)' },
  { value: 'Decommissioned', label: 'Decommissioned (Scrapped)' },
];

export function MaintenancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Update modal state
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<MaintenanceStatus>('Completed');
  const [actualCostPesos, setActualCostPesos] = useState<number>(0);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [returnToService, setReturnToService] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>('/maintenance');
      setRecords(data);
    } catch (err) {
      console.error('Failed to load maintenance records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setSubmitting(true);

    try {
      await apiRequest(`/maintenance/${selectedRecord.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          actual_cost_centavos: Math.round(actualCostPesos * 100),
          resolution_notes: resolutionNotes,
          return_to_service: returnToService,
        }),
      });

      setMessage(`Maintenance ticket for ${selectedRecord.tool_name} updated.`);
      setSelectedRecord(null);
      await fetchRecords();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Equipment Maintenance & Repair Board
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track tool defects, repair schedules, parts costs, and return-to-service decisions.
          </p>
        </div>

        <Button onClick={() => setIsReportModalOpen(true)} className="gap-2 self-start sm:self-auto">
          <PlusCircle className="h-4 w-4" /> Report Tool Defect
        </Button>
      </div>

      {message && <Alert variant="success">{message}</Alert>}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-12 w-12 text-slate-400 stroke-1" />}
          title="No open maintenance tickets"
          description="All municipal tools are in active working condition."
        />
      ) : (
        <div className="space-y-3">
          {records.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {m.tool_name}
                    </h4>
                    <Badge status={m.severity} />
                    <Badge status={m.status} />
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    <strong>Issue:</strong> {m.issue_description}
                  </p>

                  <p className="text-xs text-slate-500">
                    Reported by: {m.reporter_name} &bull; Scheduled: {m.scheduled_date ? formatDate(m.scheduled_date) : 'Unscheduled'}
                    {m.technician_name && ` • Technician: ${m.technician_name}`}
                  </p>

                  {m.resolution_notes && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded">
                      Resolution: {m.resolution_notes} (Cost: {formatPHP(m.actual_cost_centavos)})
                    </p>
                  )}
                </div>

                <div className="self-end md:self-center">
                  {m.status !== 'Completed' && m.status !== 'Decommissioned' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedRecord(m);
                        setNewStatus('Completed');
                        setActualCostPesos(m.estimated_cost_centavos / 100);
                      }}
                    >
                      Update / Resolve Ticket
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Report Modal */}
      <MaintenanceReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={fetchRecords}
      />

      {/* Update Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Resolve Ticket: ${selectedRecord.tool_name}`}
        >
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <Select
              label="New Maintenance Status"
              options={STATUS_OPTIONS}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as MaintenanceStatus)}
            />

            <Input
              label="Actual Repair / Parts Cost (₱)"
              type="number"
              min="0"
              value={actualCostPesos}
              onChange={(e) => setActualCostPesos(Number(e.target.value))}
            />

            <Input
              label="Resolution Notes"
              placeholder="e.g. Spark plug replaced, carburetor ultrasonically cleaned, verified running"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              required
            />

            {newStatus === 'Completed' && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <input
                  type="checkbox"
                  id="returnToService"
                  checked={returnToService}
                  onChange={(e) => setReturnToService(e.target.checked)}
                  className="rounded text-civic-forest focus:ring-civic-accent h-4 w-4"
                />
                <label htmlFor="returnToService" className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  Return item to service (Restore to "Available" status in Catalog)
                </label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedRecord(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Save Updates
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

