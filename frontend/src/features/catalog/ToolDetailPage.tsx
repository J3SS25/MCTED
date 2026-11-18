import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { resolveToolImages, setLocalToolImages } from '../../lib/local-storage';
import { ToolImageGallery } from '../../components/catalog/ToolImageGallery';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Skeleton';
import { ReservationFormModal } from '../reservations/ReservationFormModal';
import { ToolFormModal } from '../inventory/ToolFormModal';
import {
  ArrowLeft,
  Star,
  MessageSquare,
  CalendarCheck,
  Edit,
  Trash2,
  UserCheck,
  Building2,
  Calendar,
  Hash,
  Package,
} from 'lucide-react';
import type { Tool } from '@mcteb/shared';
import { formatDateTime } from '@mcteb/shared';

export function ToolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tool, setTool] = useState<Tool | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      if (!id) return;
      const [toolData, reviewData] = await Promise.all([
        apiRequest<Tool>(`/tools/${id}`),
        apiRequest<any[]>(`/feedback/public?tool_id=${id}`),
      ]);
      setTool(toolData);
      setReviews(reviewData);
    } catch (err) {
      console.error('Failed to load tool detail', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteTool = async () => {
    if (!tool) return;
    if (!confirm(`Are you sure you want to permanently remove "${tool.name}" from inventory?`)) {
      return;
    }
    try {
      await apiRequest(`/tools/${tool.id}`, { method: 'DELETE' });
      setLocalToolImages(tool.id, null);
      navigate('/catalog');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete tool');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-80 rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          Equipment item not found
        </h3>
        <Link
          to="/catalog"
          className="text-civic-deep dark:text-civic-light hover:underline mt-2 inline-block"
        >
          Return to catalog
        </Link>
      </div>
    );
  }

  const isAvailable = tool.availability_status === 'Available' && tool.available_quantity > 0;
  const canManage = Boolean(
    user && (user.role === 'Administrator' || user.role === 'Municipal Staff'),
  );
  const images = resolveToolImages(tool);
  const ownerLabel =
    tool.owner_name && tool.owner_role === 'Borrower'
      ? `${tool.owner_name} (${tool.owner_role}${tool.owner_barangay ? ` • Brgy. ${tool.owner_barangay}` : ''})`
      : tool.owner_name
        ? `${tool.owner_name} (${tool.owner_role || 'Staff'})`
        : 'Municipal Tool Bank (LGU Basco, Batanes)';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/catalog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Equipment Catalog
        </Link>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setEditModalOpen(true)}
            >
              <Edit className="h-3.5 w-3.5" /> Edit Tool
            </Button>
            <Button size="sm" variant="danger" className="gap-1.5" onClick={handleDeleteTool}>
              <Trash2 className="h-3.5 w-3.5" /> Delete Tool
            </Button>
          </div>
        )}
      </div>

      {banner && (
        <Alert variant="success" onClose={() => setBanner(null)}>
          {banner}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Tool Image Carousel & Gallery */}
        <div className="space-y-2">
          <ToolImageGallery images={images} alt={tool.name} />
        </div>

        {/* Tool Specifications & Actions */}
        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                {tool.category}
              </span>
              <Badge status={tool.availability_status} />
              <Badge status={tool.condition_status} />
              {tool.owner_name && tool.owner_role === 'Borrower' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                  <UserCheck className="h-3.5 w-3.5" /> Shared by {tool.owner_name}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{tool.name}</h1>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
              Serial ID Number: {tool.serial_number || 'Not Assigned'}
            </p>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {tool.description}
          </p>

          {/* Complete Tool & Equipment Details Card */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <dt className="text-slate-500 dark:text-slate-400 font-medium">Tool Name</dt>
              <dd className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{tool.name}</dd>
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
              <dt className="text-slate-500 dark:text-slate-400 font-medium">Availability Status</dt>
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

          {tool.specifications && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Technical Specifications
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {tool.specifications}
              </p>
            </div>
          )}

          {/* Stock Summary */}
          <div className="flex items-center justify-between p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Available Stock</p>
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                {tool.available_quantity} / {tool.total_quantity} unit(s)
              </p>
            </div>
            <Badge status={tool.availability_status} />
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-1">
            {!user ? (
              <div className="space-y-2">
                <Button
                  variant="primary"
                  className="w-full gap-2"
                  disabled={!isAvailable}
                  onClick={() =>
                    navigate('/login', { state: { from: { pathname: `/catalog/${tool.id}` } } })
                  }
                >
                  <CalendarCheck className="h-4 w-4" />
                  {isAvailable ? 'Sign In to Borrow' : 'Currently Unavailable'}
                </Button>
                <p className="text-center text-xs text-slate-500">
                  Residency in Basco required for equipment loans
                </p>
              </div>
            ) : user.role === 'Borrower' ? (
              <Button
                className="w-full gap-2"
                variant="primary"
                disabled={!isAvailable}
                onClick={() => setReserveModalOpen(true)}
              >
                <CalendarCheck className="h-4 w-4" />
                {isAvailable ? 'Borrow Now' : 'Currently Unavailable'}
              </Button>
            ) : (
              <Link to="/staff/inventory" className="block w-full">
                <Button variant="ghost" className="w-full">
                  Open Full Inventory Ledger
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Community Reviews Section */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-civic-accent" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Borrower Reviews ({reviews.length})
          </h3>
        </div>

        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            No public feedback submitted for this item yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <Card key={rev.id}>
                <CardContent className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {rev.reviewer_name} (Brgy. {rev.reviewer_barangay})
                    </span>
                    <div className="flex items-center text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="ml-1 font-bold">{rev.overall_rating}/5</span>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 italic">"{rev.comments}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reservation Modal */}
      {tool && (
        <ReservationFormModal
          isOpen={reserveModalOpen}
          onClose={() => setReserveModalOpen(false)}
          tool={tool}
        />
      )}

      {/* Edit Tool Modal (Municipal Staff & Administrator only) */}
      {canManage && tool && (
        <ToolFormModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          tool={tool}
          onSuccess={() => {
            setBanner('Tool record updated.');
            loadData();
          }}
        />
      )}
    </div>
  );
}
