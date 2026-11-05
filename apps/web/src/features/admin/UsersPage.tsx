import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Skeleton';
import { Users, Shield, UserX, UserCheck, ShieldAlert } from 'lucide-react';
import type { User, UserRole, UserStatus } from '@mcteb/shared';
import { formatDate } from '@mcteb/shared';

const ROLES: Array<{ value: UserRole; label: string }> = [
  { value: 'Borrower', label: 'Borrower (Resident)' },
  { value: 'Municipal Staff', label: 'Municipal Staff' },
  { value: 'Administrator', label: 'Administrator' },
];

const STATUSES: Array<{ value: UserStatus; label: string }> = [
  { value: 'Active', label: 'Active' },
  { value: 'Pending Verification', label: 'Pending Verification' },
  { value: 'Suspended', label: 'Suspended' },
];

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit user state
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('Borrower');
  const [newStatus, setNewStatus] = useState<UserStatus>('Active');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<User[]>('/users');
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEditModal = (u: User) => {
    setTargetUser(u);
    setNewRole(u.role);
    setNewStatus(u.status);
    setReason('');
    setError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    setError(null);
    setSubmitting(true);

    try {
      // If role changed
      if (newRole !== targetUser.role) {
        await apiRequest(`/users/${targetUser.id}/role`, {
          method: 'PATCH',
          body: JSON.stringify({ role: newRole, reason }),
        });
      }

      // If status changed
      if (newStatus !== targetUser.status) {
        await apiRequest(`/users/${targetUser.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus, reason }),
        });
      }

      setMessage(`Account for ${targetUser.full_name} successfully updated.`);
      setTargetUser(null);
      await fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          User & Account Oversight
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Administrator management of municipal account roles, statuses, and permissions.
        </p>
      </div>

      {message && <Alert variant="success">{message}</Alert>}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">Resident / Account</th>
                  <th className="px-4 py-3">Barangay</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {u.full_name} {isSelf && <span className="text-[10px] text-emerald-600 font-bold">(You)</span>}
                        </div>
                        <div className="text-[11px] text-slate-500">{u.email} &bull; {u.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {u.barangay}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={u.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(u)}
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Role & Status Modal */}
      {targetUser && (
        <Modal
          isOpen={!!targetUser}
          onClose={() => setTargetUser(null)}
          title={`Manage Account: ${targetUser.full_name}`}
        >
          {error && <Alert variant="error" className="mb-4">{error}</Alert>}

          <form onSubmit={handleUpdate} className="space-y-4">
            <Select
              label="Assigned System Role"
              options={ROLES}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
            />

            <Select
              label="Account Status"
              options={STATUSES}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as UserStatus)}
            />

            <Input
              label="Administrative Reason (Required for Audit Trail)"
              placeholder="e.g. Verified barangay residency ID; Staff appointment"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="h-4 w-4 inline mr-1" />
              Administrative safeguards prohibit suspending your own active account or demoting the sole remaining Administrator.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setTargetUser(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Save Account Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

