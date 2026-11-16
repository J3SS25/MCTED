import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { apiRequest } from '../../lib/api';
import {
  compressImageToDataUrl,
  resolveToolImage,
  setLocalToolImage,
  useProfilePicture,
} from '../../lib/local-storage';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { ToolFormModal } from '../inventory/ToolFormModal';
import {
  Mail,
  Calendar,
  Camera,
  Trash2,
  MapPin,
  Plus,
  Edit,
  Wrench,
} from 'lucide-react';
import {
  calculateAgeFromBirthDate,
  formatDate,
  formatPHP,
  type Barangay,
  type Tool,
} from '@mcteb/shared';

const BASE_BARANGAYS: Array<{ value: string; label: string }> = [
  { value: 'Chanarian', label: 'Chanarian' },
  { value: 'Ihubok I (Kayvaluganan)', label: 'Ihubok I (Kayvaluganan)' },
  { value: 'Ihubok II (Kaychanarianan)', label: 'Ihubok II (Kaychanarianan)' },
  { value: 'Kayhuvokan', label: 'Kayhuvokan' },
  { value: 'San Antonio', label: 'San Antonio' },
  { value: 'San Joaquin', label: 'San Joaquin' },
];

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [localAvatar, updateLocalAvatar] = useProfilePicture(user?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultAge = user?.age ?? (user?.birth_date ? calculateAgeFromBirthDate(user.birth_date) : 18);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    barangay: (user?.barangay as string) || 'San Antonio',
    province: user?.province || 'Batanes',
    age: defaultAge >= 18 ? defaultAge : 18,
    address: user?.address || '',
  });

  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // User's uploaded tools
  const [myTools, setMyTools] = useState<Tool[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolModalOpen, setToolModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  useEffect(() => {
    if (!user) return;
    const computed = user.age ?? calculateAgeFromBirthDate(user.birth_date);
    setFormData({
      full_name: user.full_name,
      phone: user.phone,
      barangay: user.barangay,
      province: user.province || 'Batanes',
      age: computed >= 18 ? computed : 18,
      address: user.address,
    });
  }, [user]);

  const fetchMyTools = useCallback(async () => {
    if (!user) return;
    setToolsLoading(true);
    try {
      const res = await apiRequest<{ items: Tool[] }>(`/tools?owner_id=${user.id}&limit=100`);
      setMyTools(res.items || []);
    } catch (err) {
      console.error('Failed to load user tools', err);
    } finally {
      setToolsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyTools();
  }, [fetchMyTools]);

  if (!user) return null;

  const avatarSrc = localAvatar || user.avatar_url || null;

  const barangayOptions = BASE_BARANGAYS.some((b) => b.value === formData.barangay)
    ? BASE_BARANGAYS
    : [{ value: formData.barangay, label: formData.barangay }, ...BASE_BARANGAYS];

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file (PNG, JPG, WebP, etc.).');
      return;
    }

    setError(null);
    setMessage(null);
    setAvatarBusy(true);

    try {
      const compressed = await compressImageToDataUrl(file, 360, 0.8);
      updateLocalAvatar(compressed);
      setMessage('Profile picture saved to browser local storage.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile picture');
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleRemoveAvatar = () => {
    updateLocalAvatar(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMessage('Profile picture removed from local storage.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (formData.age < 18) {
      setError('Age must be 18 years old or above.');
      return;
    }

    setSaving(true);

    try {
      await apiRequest(`/users/${user.id}/profile`, {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone,
          barangay: formData.barangay as Barangay,
          province: formData.province,
          age: Number(formData.age),
          address: formData.address,
        }),
      });

      await refreshUser();
      setMessage('Profile details successfully updated.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOwnTool = async (tool: Tool) => {
    if (
      !confirm(
        `Remove "${tool.name}" from the catalog? You can delete your own uploaded tools immediately without staff approval.`,
      )
    ) {
      return;
    }

    try {
      await apiRequest(`/tools/${tool.id}`, { method: 'DELETE' });
      setLocalToolImage(tool.id, null);
      setMessage(`"${tool.name}" was deleted from your uploaded tools.`);
      await fetchMyTools();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove tool');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          User Account & Profile
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Update your profile picture (stored in local storage), personal details, and manage your shared tools.
        </p>
      </div>

      {message && (
        <Alert variant="success" onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Account Overview Card with Local Storage Avatar Upload */}
      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user.full_name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-civic-accent shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-civic-forest text-white flex items-center justify-center font-bold text-3xl shadow-sm">
                  {user.full_name.charAt(0)}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarBusy}
                aria-label="Change profile picture"
                className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-civic-forest text-white shadow-md hover:bg-civic-deep border-2 border-white dark:border-slate-800"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                  {user.full_name}
                </h3>
                <Badge status={user.status} />
              </div>
              <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </p>
              <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Brgy. {user.barangay}, {user.province || 'Batanes'}
                {formData.age ? ` • Age ${formData.age}` : ''}
              </p>
              <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Registered: {formatDate(user.created_at)}
              </p>

              <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  isLoading={avatarBusy}
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5 text-xs"
                >
                  <Camera className="h-3.5 w-3.5" />
                  {avatarSrc ? 'Update Photo' : 'Upload Photo'}
                </Button>
                {localAvatar && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleRemoveAvatar}
                    className="gap-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove Photo
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="self-center sm:self-start">
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
            Personal, Residential & Contact Details
          </h4>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Full Name"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <Input
                label="Age (18+)"
                type="number"
                min={18}
                max={120}
                required
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Contact Number"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <Select
                label="Barangay"
                options={barangayOptions}
                value={formData.barangay}
                onChange={(e) => setFormData({ ...formData, barangay: e.target.value })}
              />

              <Input
                label="Province"
                required
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                placeholder="Batanes"
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

      {/* User / Borrower Uploaded Tools Management */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-civic-forest dark:text-civic-light" />
                My Uploaded Tools & Equipment ({myTools.length})
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tools you share can be edited or removed directly by you at any time without staff approval.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setEditingTool(null);
                setToolModalOpen(true);
              }}
              className="gap-1.5 self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" /> Upload Tool
            </Button>
          </div>

          {toolsLoading ? (
            <p className="text-xs text-slate-500">Loading your uploaded tools...</p>
          ) : myTools.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500">
              You have not uploaded any tools yet. Click <strong>Upload Tool</strong> to share equipment with the community.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myTools.map((tool) => (
                <div
                  key={tool.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-900/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center flex-shrink-0">
                      <img
                        src={resolveToolImage(tool)}
                        alt={tool.name}
                        className="max-h-full max-w-full object-contain rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/equipment/fallback.svg';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <Link to={`/catalog/${tool.id}`} className="font-semibold text-sm hover:underline block truncate">
                        {tool.name}
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{tool.category}</span>
                        <span>&bull;</span>
                        <span>{formatPHP(tool.rental_fee_centavos)}/day</span>
                      </div>
                      <div className="mt-1">
                        <Badge status={tool.availability_status} className="text-[10px] px-2 py-0" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Edit Tool"
                      onClick={() => {
                        setEditingTool(tool);
                        setToolModalOpen(true);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Delete Tool"
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => handleDeleteOwnTool(tool)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ToolFormModal
        isOpen={toolModalOpen}
        onClose={() => {
          setToolModalOpen(false);
          setEditingTool(null);
        }}
        tool={editingTool}
        onSuccess={() => {
          setMessage(editingTool ? 'Your tool was updated.' : 'Your tool was uploaded to the catalog.');
          fetchMyTools();
        }}
      />
    </div>
  );
}
