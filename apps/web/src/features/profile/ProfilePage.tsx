import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { User, Shield, MapPin, Phone, Mail, Calendar } from 'lucide-react';
import type { Barangay } from '@mcteb/shared';
import { formatDate } from '@mcteb/shared';

const BARANGAYS: Array<{ value: Barangay; label: string }> = [
  { value: 'Chanarian', label: 'Chanarian' },
  { value: 'Ihubok I (Kayvaluganan)', label: 'Ihubok I (Kayvaluganan)' },
  { value: 'Ihubok II (Kaychanarianan)', label: 'Ihubok II (Kaychanarianan)' },
  { value: 'Kayhuvokan', label: 'Kayhuvokan' },
  { value: 'San Antonio', label: 'San Antonio' },
  { value: 'San Joaquin', label: 'San Joaquin' },
];

export function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    barangay: (user?.barangay as Barangay) || 'San Antonio',
    address: user?.address || '',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setSaving(true);

    try {
      await apiRequest(`/users/${user.id}/profile`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });

      await refreshUser();
      setMessage('Profile contact details successfully updated.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          User Account & Profile
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your contact information and review verified municipal status.
        </p>
      </div>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Account Overview Card */}
      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-civic-forest text-white flex items-center justify-center font-bold text-2xl shadow-sm">
              {user.full_name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                  {user.full_name}
                </h3>
                <Badge status={user.status} />
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Registered: {formatDate(user.created_at)}
              </p>
            </div>
          </div>

          <div className="self-end sm:self-center">
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              Role: {user.role}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardContent className="p-6">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Residential & Contact Details
          </h4>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact Number"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <Select
                label="Barangay"
                options={BARANGAYS}
                value={formData.barangay}
                onChange={(e) => setFormData({ ...formData, barangay: e.target.value as Barangay })}
              />
            </div>

            <Input
              label="Street Address"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />

            <div className="pt-2 flex justify-end">
              <Button type="submit" isLoading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

