import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import {
  compressImageToDataUrl,
  getLocalToolImage,
  setLocalToolImage,
} from '../../lib/local-storage';
import {
  TOOL_CATEGORIES,
  type Tool,
  type ToolAvailabilityStatus,
  type ToolConditionStatus,
} from '@mcteb/shared';

const CATEGORIES = TOOL_CATEGORIES.map((c) => ({ value: c, label: c }));

const AVAILABILITY_STATUSES: Array<{ value: ToolAvailabilityStatus; label: string }> = [
  { value: 'Available', label: 'Available' },
  { value: 'Borrowed', label: 'Borrowed' },
  { value: 'Reserved', label: 'Reserved' },
  { value: 'Maintenance', label: 'Maintenance' },
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Agriculture',
    description: '',
    specifications: '',
    rentalFeePesos: 50,
    depositFeePesos: 200,
    discountPercent: 0,
    totalQuantity: 1,
    serialNumber: '',
    availabilityStatus: 'Available' as ToolAvailabilityStatus,
    conditionStatus: 'Good' as ToolConditionStatus,
    imageUrl: '',
  });

  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (tool) {
      const localImg = getLocalToolImage(tool.id);
      setFormData({
        name: tool.name,
        category:
          tool.category === 'Agricultural'
            ? 'Agriculture'
            : tool.category === 'Fishery'
              ? 'Fishing'
              : tool.category,
        description: tool.description,
        specifications: tool.specifications || '',
        rentalFeePesos: tool.rental_fee_centavos / 100,
        depositFeePesos: tool.deposit_fee_centavos / 100,
        discountPercent: tool.discount_percent ?? 0,
        totalQuantity: tool.total_quantity,
        serialNumber: tool.serial_number || '',
        availabilityStatus: tool.availability_status,
        conditionStatus: tool.condition_status,
        imageUrl: localImg || tool.image_url || '',
      });
    } else {
      setFormData({
        name: '',
        category: 'Agriculture',
        description: '',
        specifications: '',
        rentalFeePesos: 50,
        depositFeePesos: 200,
        discountPercent: 0,
        totalQuantity: 1,
        serialNumber: '',
        availabilityStatus: 'Available',
        conditionStatus: 'Good',
        imageUrl: '',
      });
    }
    setError(null);
  }, [tool, isOpen]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP, or SVG).');
      return;
    }

    setError(null);
    setImageUploading(true);
    try {
      const dataUrl = await compressImageToDataUrl(file, 640, 0.82);
      setFormData((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process selected image');
    } finally {
      setImageUploading(false);
    }
  };

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
        discount_percent: Math.min(100, Math.max(0, Number(formData.discountPercent) || 0)),
        total_quantity: Number(formData.totalQuantity),
        serial_number: formData.serialNumber || undefined,
        availability_status: formData.availabilityStatus,
        condition_status: formData.conditionStatus,
        image_url: formData.imageUrl || undefined,
      };

      let savedTool: Tool;
      if (isEditing && tool) {
        savedTool = await apiRequest<Tool>(`/tools/${tool.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        savedTool = await apiRequest<Tool>('/tools', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (savedTool?.id) {
        setLocalToolImage(savedTool.id, formData.imageUrl || null);
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
      title={isEditing ? `Edit Equipment: ${tool.name}` : 'Add New Tool / Equipment'}
      maxWidth="lg"
    >
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Photo Upload & Preview */}
        <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Tool / Equipment Photo
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-24 h-24 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              {formData.imageUrl ? (
                <img
                  src={formData.imageUrl}
                  alt="Equipment preview"
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              )}
            </div>

            <div className="flex-1 space-y-2 w-full">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  isLoading={imageUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {formData.imageUrl ? 'Change Photo' : 'Upload Photo'}
                </Button>
                {formData.imageUrl && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, imageUrl: '' }));
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Upload a photo (JPG, PNG, WebP) to display in catalog listings and inventory
                records.
              </p>
            </div>
          </div>
        </div>

        <Input
          label="Equipment Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Inverter Silent Generator 3.5 kVA"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            label="Discount (%)"
            type="number"
            min="0"
            max="100"
            value={formData.discountPercent}
            onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Availability Status"
            options={AVAILABILITY_STATUSES}
            value={formData.availabilityStatus}
            onChange={(e) =>
              setFormData({
                ...formData,
                availabilityStatus: e.target.value as ToolAvailabilityStatus,
              })
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
          <Button type="submit" isLoading={submitting || imageUploading}>
            {isEditing ? 'Save Changes' : 'Add Equipment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
