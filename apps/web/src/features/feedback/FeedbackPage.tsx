import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { SubmitFeedbackModal } from './SubmitFeedbackModal';
import { MessageSquare, Star, PlusCircle, Eye, EyeOff } from 'lucide-react';
import { formatDate } from '@mcteb/shared';

export function FeedbackPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const isStaffOrAdmin = user?.role === 'Municipal Staff' || user?.role === 'Administrator';

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const endpoint = isStaffOrAdmin ? '/feedback/all' : '/feedback/public';
      const data = await apiRequest<any[]>(endpoint);
      setReviews(data);
    } catch (err) {
      console.error('Failed to load feedback', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [user]);

  const toggleModeration = async (review: any) => {
    try {
      await apiRequest(`/feedback/${review.id}/moderate`, {
        method: 'PATCH',
        body: JSON.stringify({ is_public: !review.is_public }),
      });
      await fetchReviews();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Moderation action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Resident Feedback & Tool Reviews
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Read authentic feedback from Basco residents on equipment condition and civic service.
          </p>
        </div>

        {user?.role === 'Borrower' && (
          <Button onClick={() => setIsSubmitModalOpen(true)} className="gap-2 self-start sm:self-auto">
            <PlusCircle className="h-4 w-4" /> Share Your Experience
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-12 w-12 text-slate-400 stroke-1" />}
          title="No reviews posted yet"
          description="Be the first to submit a review for borrowed equipment."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <Card key={rev.id} className="flex flex-col justify-between">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {rev.tool_name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {rev.reviewer_name} &bull; Brgy. {rev.reviewer_barangay} &bull; {formatDate(rev.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="ml-1 text-sm font-bold text-slate-800 dark:text-slate-200">
                      {rev.overall_rating}/5
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 text-[11px] text-slate-500 border-y border-slate-100 dark:border-slate-700/60 py-2">
                  <span>Condition: <strong>{rev.tool_condition_rating}/5</strong></span>
                  <span>Service: <strong>{rev.service_rating}/5</strong></span>
                  {isStaffOrAdmin && (
                    <span>Status: <Badge status={rev.is_public ? 'Available' : 'Archived'}>{rev.is_public ? 'Public' : 'Hidden'}</Badge></span>
                  )}
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                  "{rev.comments}"
                </p>

                {isStaffOrAdmin && (
                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => toggleModeration(rev)}
                    >
                      {rev.is_public ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> Hide Review
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" /> Make Public
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Submit Modal */}
      <SubmitFeedbackModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={fetchReviews}
      />
    </div>
  );
}

