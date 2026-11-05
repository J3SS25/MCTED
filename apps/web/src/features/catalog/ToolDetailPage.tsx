import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { ReservationFormModal } from '../reservations/ReservationFormModal';
import { ArrowLeft, Check, Shield, Star, MessageSquare } from 'lucide-react';
import type { Tool } from '@mcteb/shared';
import { formatPHP } from '@mcteb/shared';

export function ToolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tool, setTool] = useState<Tool | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reserveModalOpen, setReserveModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
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
    }
    loadData();
  }, [id]);

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
        <Link to="/catalog" className="text-civic-deep dark:text-civic-light hover:underline mt-2 inline-block">
          Return to catalog
        </Link>
      </div>
    );
  }

  const isAvailable = tool.availability_status === 'Available' && tool.available_quantity > 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <Link
        to="/catalog"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Equipment Catalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Tool Photo Preview */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex items-center justify-center min-h-[360px]">
          <img
            src={tool.image_url || '/equipment/fallback.svg'}
            alt={tool.name}
            className="max-h-[300px] max-w-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/equipment/fallback.svg';
            }}
          />
        </div>

        {/* Tool Specifications & Actions */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                {tool.category}
              </span>
              <Badge status={tool.availability_status} />
              <Badge status={tool.condition_status} />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {tool.name}
            </h1>
            {tool.serial_number && (
              <p className="text-xs font-mono text-slate-400 mt-1">
                Serial No: {tool.serial_number}
              </p>
            )}
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {tool.description}
          </p>

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

          {/* Pricing and Stock Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Daily Rental Fee</p>
              <p className="text-xl font-bold text-civic-forest dark:text-civic-light">
                {formatPHP(tool.rental_fee_centavos)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Security Deposit</p>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                {formatPHP(tool.deposit_fee_centavos)}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2">
            {!user ? (
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => navigate('/login', { state: { from: { pathname: `/catalog/${tool.id}` } } })}
                >
                  Sign In to Reserve Equipment
                </Button>
                <p className="text-center text-xs text-slate-500">
                  Residency in Basco required for equipment loans
                </p>
              </div>
            ) : user.role === 'Borrower' ? (
              <Button
                className="w-full"
                size="lg"
                disabled={!isAvailable}
                onClick={() => setReserveModalOpen(true)}
              >
                {isAvailable ? 'Request Reservation' : 'Currently Unavailable'}
              </Button>
            ) : (
              <Link to="/staff/inventory" className="block w-full">
                <Button variant="outline" className="w-full">
                  Manage Tool in Inventory
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
                  <p className="text-slate-600 dark:text-slate-300 italic">
                    "{rev.comments}"
                  </p>
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
    </div>
  );
}

