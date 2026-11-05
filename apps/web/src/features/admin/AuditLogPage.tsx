import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ShieldCheck, Search, Filter } from 'lucide-react';
import type { AuditLog } from '@mcteb/shared';
import { formatDateTime } from '@mcteb/shared';

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      params.append('limit', '50');

      const data = await apiRequest<{ items: AuditLog[]; total: number }>(`/audit?${params.toString()}`);
      setLogs(data.items);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Municipal System Audit Log
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Immutable audit trail of all administrative actions, approvals, inventory changes, and logins.
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by action code (e.g. RESERVATION_APPROVED, TOOL_CREATED, USER_LOGIN)..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-civic-accent"
          />
        </div>
        <Button type="submit" size="md">
          Filter
        </Button>
      </form>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-12 w-12 text-slate-400 stroke-1" />}
          title="No audit entries"
          description="No recorded audit actions match your search query."
        />
      ) : (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-sans">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-sans font-semibold text-slate-800 dark:text-slate-200">
                      {log.actor_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {log.target_type}: {log.target_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 font-sans text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-sans">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedLog(log)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Log Record: ${selectedLog.action}`}
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-1 font-mono">
              <p><strong>Log ID:</strong> {selectedLog.id}</p>
              <p><strong>Actor:</strong> {selectedLog.actor_name} ({selectedLog.actor_id || 'System'})</p>
              <p><strong>Action:</strong> {selectedLog.action}</p>
              <p><strong>Target Type:</strong> {selectedLog.target_type}</p>
              <p><strong>Target ID:</strong> {selectedLog.target_id}</p>
              <p><strong>IP Address:</strong> {selectedLog.ip_address || 'Internal'}</p>
              <p><strong>Recorded At:</strong> {formatDateTime(selectedLog.created_at)}</p>
            </div>

            <div>
              <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1">Details & Remarks:</h4>
              <p className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {selectedLog.details || 'No additional details provided.'}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="button" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

