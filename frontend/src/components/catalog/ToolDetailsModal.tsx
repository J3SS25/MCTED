import React from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ToolImageGallery } from './ToolImageGallery';
import { resolveToolImages } from '../../lib/local-storage';
import { useAuth } from '../../lib/auth-context';
import { formatDateTime, type Tool } from '@mcteb/shared';
import {
  CalendarCheck,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  Hash,
  UserCheck,
  Building2,
  Package,
} from 'lucide-react';

interface ToolDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: Tool | null;
  canManage?: boolean;
  onEdit?: (tool: Tool) => void;
  onDelete?: (tool: Tool) => void;
  onBorrowNow?: (tool: Tool) => void;
  onReserve?: (tool: Tool) => void;
}

export function ToolDetailsModal({
  isOpen,
  onClose,
  tool,
  canManage = false,
  onEdit,
  onDelete,
  onBorrowNow,
  onReserve,
}: ToolDetailsModalProps) {
  const { user } = useAuth();

  if (!tool) return null;

  const images = resolveToolImages(tool);
  const isAvailable = tool.availability_status === 'Available' && tool.available_quantity > 0;
  const borrowHandler = onBorrowNow ?? onReserve;
  const showBorrowButton = !canManage && (!user || user.role === 'Borrower');

  const ownerLabel =
    tool.owner_name && tool.owner_role === 'Borrower'
      ? `${tool.owner_name} (${tool.owner_role}${tool.owner_barangay ? ` • Brgy. ${tool.owner_barangay}` : ''})`
      : tool.owner_name
        ? `${tool.owner_name} (${tool.owner_role || 'Staff'})`
        : 'Municipal Tool Bank (LGU Basco, Batanes)';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Tool & Equipment Details" maxWidth="2xl">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Uploaded Images Carousel & Gallery */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Uploaded Images ({images.length})
            </p>
            <ToolImageGallery
              images={images}
              alt={tool.name}
              compact
            />
          </div>

          {/* Structured Complete Tool Details */}
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  {tool.category}
                </span>
                <Badge status={tool.availability_status} />
                <Badge status={tool.condition_status} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{tool.name}</h3>
            </div>

            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Description
              </p>
              <p>{tool.description}</p>
            </div>

            {/* Complete Attribute Grid */}
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <dt className="text-slate-500 dark:text-slate-400 font-medium">Tool Name</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  {tool.name}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500 dark:text-slate-400 font-medium">Category</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  {tool.category}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <Hash className="h-3 w-3" /> Serial ID Number
                </dt>
                <dd className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  {tool.serial_number || 'Not Assigned'}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500 dark:text-slate-400 font-medium">Condition</dt>
                <dd className="mt-0.5">
                  <Badge status={tool.condition_status} className="text-[10px] px-2 py-0" />
                </dd>
              </div>

              <div>
                <dt className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <Package className="h-3 w-3" /> Quantity
                </dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  {tool.available_quantity} Available / {tool.total_quantity} Total Unit(s)
                </dd>
              </div>

              <div>
                <dt className="text-slate-500 dark:text-slate-400 font-medium">
                  Availability Status
                </dt>
                <dd className="mt-0.5">
                  <Badge status={tool.availability_status} className="text-[10px] px-2 py-0" />
                </dd>
              </div>

              <div>
                <dt className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Upload Date
                </dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  {formatDateTime(tool.created_at)}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  {tool.owner_role === 'Borrower' ? (
                    <UserCheck className="h-3 w-3" />
                  ) : (
                    <Building2 className="h-3 w-3" />
                  )}{' '}
                  Owner Information
                </dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  {ownerLabel}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Technical Specifications (when present) */}
        {tool.specifications && (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Technical Specifications
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line">
              {tool.specifications}
            </p>
          </div>
        )}

        {/* Action Bar */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {showBorrowButton && (
              <Button
                size="sm"
                variant="primary"
                disabled={!isAvailable}
                onClick={() => {
                  onClose();
                  borrowHandler?.(tool);
                }}
                className="gap-1.5"
              >
                <CalendarCheck className="h-3.5 w-3.5" />
                {isAvailable ? 'Borrow Now' : 'Unavailable'}
              </Button>
            )}

            <Link to={`/catalog/${tool.id}`} onClick={onClose}>
              <Button size="sm" variant="ghost" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" /> Full Page
              </Button>
            </Link>
          </div>

          {canManage && (onEdit || onDelete) && (
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    onClose();
                    onEdit(tool);
                  }}
                >
                  <Edit className="h-3.5 w-3.5" /> Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="danger"
                  className="gap-1.5"
                  onClick={() => {
                    onClose();
                    onDelete(tool);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
