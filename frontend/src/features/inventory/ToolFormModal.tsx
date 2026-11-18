import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import {
  Upload,
  X,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import {
  compressImageToDataUrl,
  getLocalToolImages,
  setLocalToolImages,
  moderateImageFileClient,
} from '../../lib/local-storage';
import {
  MAX_TOOL_IMAGES,
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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error(`Failed to read image file "${file.name}"`));
    reader.readAsDataURL(file);
  });
}

export function ToolFormModal({ isOpen, onClose, tool, onSuccess }: ToolFormModalProps) {
  const isEditing = !!tool;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Agriculture',
    description: '',
    specifications: '',
    totalQuantity: 1,
    serialNumber: '',
    availabilityStatus: 'Available' as ToolAvailabilityStatus,
    conditionStatus: 'Good' as ToolConditionStatus,
    imageUrls: [] as string[],
    imageFilenames: [] as string[],
  });

  const [activeSlide, setActiveSlide] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);
  const [serialStatus, setSerialStatus] = useState<
    'idle' | 'checking' | 'valid' | 'duplicate' | 'error'
  >('idle');
  const [serialMessage, setSerialMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (tool) {
      const apiImages = Array.isArray(tool.image_urls) ? tool.image_urls.filter(Boolean) : [];
      const localImages = getLocalToolImages(tool.id);
      const initialImages =
        apiImages.length > 0
          ? apiImages.slice(0, MAX_TOOL_IMAGES)
          : localImages.length > 0
            ? localImages.slice(0, MAX_TOOL_IMAGES)
            : tool.image_url
              ? [tool.image_url]
              : [];

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
        totalQuantity: tool.total_quantity,
        serialNumber: tool.serial_number || '',
        availabilityStatus: tool.availability_status,
        conditionStatus: tool.condition_status,
        imageUrls: initialImages,
        imageFilenames: initialImages.map((_, idx) => `existing-image-${idx + 1}`),
      });
    } else {
      setFormData({
        name: '',
        category: 'Agriculture',
        description: '',
        specifications: '',
        totalQuantity: 1,
        serialNumber: '',
        availabilityStatus: 'Available',
        conditionStatus: 'Good',
        imageUrls: [],
        imageFilenames: [],
      });
    }
    setActiveSlide(0);
    setSerialStatus('idle');
    setSerialMessage(null);
    setError(null);
  }, [tool, isOpen]);

  const verifySerialAvailability = async (serialValue: string): Promise<boolean> => {
    const trimmed = serialValue.trim();
    if (!trimmed) {
      setSerialStatus('error');
      setSerialMessage('Serial ID Number is required.');
      return false;
    }

    setSerialStatus('checking');
    setSerialMessage(null);
    try {
      const params = new URLSearchParams({ serial_number: trimmed });
      if (tool?.id) {
        params.append('exclude_id', tool.id);
      }

      const res = await apiRequest<{ exists: boolean; valid: boolean; message: string }>(
        `/tools/verify-serial?${params.toString()}`,
      );

      if (res.exists || !res.valid) {
        setSerialStatus('duplicate');
        setSerialMessage(
          res.message || `Serial ID Number "${trimmed}" already exists in the database.`,
        );
        return false;
      }

      setSerialStatus('valid');
      setSerialMessage(res.message || 'Serial ID Number is unique and available.');
      return true;
    } catch (err) {
      setSerialStatus('error');
      setSerialMessage(
        err instanceof Error ? err.message : 'Unable to verify Serial ID Number right now.',
      );
      return false;
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    e.target.value = '';
    if (selectedFiles.length === 0) return;

    if (formData.imageUrls.length + selectedFiles.length > MAX_TOOL_IMAGES) {
      setError(
        `You can upload a maximum of ${MAX_TOOL_IMAGES} images per tool or equipment. You currently have ${formData.imageUrls.length} image(s) attached.`,
      );
      return;
    }

    setError(null);
    setImageUploading(true);
    try {
      const acceptedUrls: string[] = [];
      const acceptedNames: string[] = [];

      for (const file of selectedFiles) {
        if (!file.type.startsWith('image/')) {
          throw new Error(
            `File "${file.name}" is not a supported image. Please select PNG, JPG, WebP, GIF, or SVG files.`,
          );
        }

        const rawDataUrl = await readFileAsDataUrl(file);
        const rawModeration = await moderateImageFileClient(file, rawDataUrl);
        if (!rawModeration.valid) {
          throw new Error(
            rawModeration.reason ||
              `Image "${file.name}" violated system content policies and was rejected.`,
          );
        }

        const finalDataUrl =
          file.type.toLowerCase() === 'image/svg+xml'
            ? rawDataUrl
            : await compressImageToDataUrl(file, 640, 0.82);

        acceptedUrls.push(finalDataUrl);
        acceptedNames.push(file.name);
      }

      setFormData((prev) => {
        const nextImages = [...prev.imageUrls, ...acceptedUrls].slice(0, MAX_TOOL_IMAGES);
        const nextNames = [...prev.imageFilenames, ...acceptedNames].slice(0, MAX_TOOL_IMAGES);
        setActiveSlide(Math.max(0, nextImages.length - 1));
        return {
          ...prev,
          imageUrls: nextImages,
          imageFilenames: nextNames,
        };
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to process and validate selected images.',
      );
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => {
      const nextImages = prev.imageUrls.filter((_, i) => i !== index);
      const nextNames = prev.imageFilenames.filter((_, i) => i !== index);
      setActiveSlide((current) => Math.max(0, Math.min(current, nextImages.length - 1)));
      return {
        ...prev,
        imageUrls: nextImages,
        imageFilenames: nextNames,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.imageUrls.length > MAX_TOOL_IMAGES) {
      setError(`You can upload a maximum of ${MAX_TOOL_IMAGES} images per tool or equipment.`);
      return;
    }

    const serialOk = await verifySerialAvailability(formData.serialNumber);
    if (!serialOk) {
      setError(
        serialMessage ||
          `Serial ID Number "${formData.serialNumber.trim()}" already exists in the database. Please enter a unique Serial ID Number.`,
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        specifications: formData.specifications || undefined,
        total_quantity: Number(formData.totalQuantity),
        serial_number: formData.serialNumber.trim(),
        availability_status: formData.availabilityStatus,
        condition_status: formData.conditionStatus,
        image_url: formData.imageUrls[0] || undefined,
        image_urls: formData.imageUrls,
        image_filenames: formData.imageFilenames,
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
        setLocalToolImages(
          savedTool.id,
          formData.imageUrls.length > 0 ? formData.imageUrls : null,
        );
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const hasMultipleImages = formData.imageUrls.length > 1;
  const activePreviewUrl = formData.imageUrls[activeSlide];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Equipment: ${tool.name}` : 'Upload New Tool / Equipment'}
      maxWidth="lg"
    >
      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Multi-Image Upload (Up to 5) & Carousel Preview */}
        <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Tool / Equipment Photos ({formData.imageUrls.length} / {MAX_TOOL_IMAGES})
            </label>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Content Moderation Active
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-44 h-32 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative flex-shrink-0">
              {activePreviewUrl ? (
                <>
                  <img
                    src={activePreviewUrl}
                    alt={`Equipment preview ${activeSlide + 1}`}
                    className="w-full h-full object-contain p-1.5"
                  />
                  {hasMultipleImages && (
                    <>
                      <button
                        type="button"
                        aria-label="Previous uploaded image"
                        onClick={() =>
                          setActiveSlide((prev) =>
                            prev === 0 ? formData.imageUrls.length - 1 : prev - 1,
                          )
                        }
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Next uploaded image"
                        onClick={() =>
                          setActiveSlide((prev) =>
                            prev === formData.imageUrls.length - 1 ? 0 : prev + 1,
                          )
                        }
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-slate-900/75 text-white text-[10px] font-semibold">
                        {activeSlide + 1} / {formData.imageUrls.length}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <ImageIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              )}
            </div>

            <div className="flex-1 space-y-2 w-full">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFileChange}
                className="hidden"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={formData.imageUrls.length >= MAX_TOOL_IMAGES}
                  isLoading={imageUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {formData.imageUrls.length >= MAX_TOOL_IMAGES
                    ? 'Maximum 5 Images Reached'
                    : formData.imageUrls.length > 0
                      ? 'Add More Photos'
                      : 'Upload Photos (Up to 5)'}
                </Button>
                {formData.imageUrls.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, imageUrls: [], imageFilenames: [] }));
                      setActiveSlide(0);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <X className="h-3.5 w-3.5" /> Clear All
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Upload up to 5 clear photos (PNG, JPG, WebP, GIF, SVG). Explicit, violent, hate, or
                illegal imagery is strictly prohibited.
              </p>
            </div>
          </div>

          {/* Thumbnail Gallery Strip */}
          {formData.imageUrls.length > 0 && (
            <div className="grid grid-cols-5 gap-2 pt-1">
              {formData.imageUrls.map((url, idx) => (
                <div
                  key={`${idx}-${url.slice(0, 24)}`}
                  className={`relative group rounded-lg border bg-white dark:bg-slate-800 h-14 overflow-hidden flex items-center justify-center p-1 ${
                    activeSlide === idx
                      ? 'border-civic-forest ring-2 ring-civic-accent/40'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    className="w-full h-full flex items-center justify-center"
                    aria-label={`Select photo ${idx + 1}`}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="max-h-full max-w-full object-contain rounded"
                    />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-0.5 left-0.5 px-1 py-0.2 rounded bg-civic-forest/90 text-white text-[9px] font-bold">
                      Main
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    aria-label={`Remove photo ${idx + 1}`}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-red-600 text-white opacity-90 hover:opacity-100"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Input
          label="Tool / Equipment Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Inverter Silent Generator 3.5 kVA"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <Select
            label="Category"
            options={CATEGORIES}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />

          <div className="space-y-1">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="Serial ID Number"
                  required
                  value={formData.serialNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, serialNumber: e.target.value });
                    setSerialStatus('idle');
                    setSerialMessage(null);
                  }}
                  onBlur={() => {
                    if (formData.serialNumber.trim()) {
                      void verifySerialAvailability(formData.serialNumber);
                    }
                  }}
                  error={serialStatus === 'duplicate' ? serialMessage || undefined : undefined}
                  placeholder="MCTEB-EQP-001"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                isLoading={serialStatus === 'checking'}
                onClick={() => void verifySerialAvailability(formData.serialNumber)}
                className="mb-0.5"
              >
                Verify
              </Button>
            </div>
            {serialStatus === 'valid' && serialMessage && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> {serialMessage}
              </p>
            )}
            {serialStatus === 'error' && serialMessage && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" /> {serialMessage}
              </p>
            )}
          </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Quantity"
            type="number"
            min="1"
            required
            value={formData.totalQuantity}
            onChange={(e) => setFormData({ ...formData, totalQuantity: Number(e.target.value) })}
          />

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
          <Button
            type="submit"
            isLoading={submitting || imageUploading || serialStatus === 'checking'}
            disabled={serialStatus === 'duplicate'}
          >
            {isEditing ? 'Save Changes' : 'Upload Tool'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
