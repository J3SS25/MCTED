import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { Skeleton } from '../../components/ui/Skeleton';
import { CalendarCheck, AlertCircle } from 'lucide-react';
import { formatDate, formatPHP } from '@mcteb/shared';

export function MyReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchReservations = async () => {
    try {
      const data = await apiRequest<any[]>('/reservations');
      setReservations(data);
    } catch (err) {
      console.error('Failed to load reservations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    setCancellingId(id);
    setMessage(null);

    try {
      await apiRequest(`/reservations/${id}/cancel`, { method: 'POST' });
      setMessage('Reservation was successfully cancelled.');
      await fetchReservations();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to cancel reservation');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          My Tool Reservations
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review the status of your municipal tool booking requests.
        </p>
      </div>

      {message && <Alert variant="success">{message}</Alert>}

      {reservations.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck className="h-12 w-12 text-slate-400 stroke-1" />}
          title="No reservations found"
          description="You haven't requested any shared equipment bookings yet."
          actionText="Browse Equipment Catalog"
          onAction={() => (window.location.href = '/catalog')}
        />
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => {
            const canCancel = res.status === 'Pending' || res.status === 'Approved';

            return (
              <Card key={res.id}>
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-700/50 p-2 flex items-center justify-center flex-shrink-0">
                      <img
                        src={res.tool_image_url || '/equipment/fallback.svg'}
                        alt={res.tool_name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/equipment/fallback.svg';
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                          {res.tool_name}
                        </h3>
                        <Badge status={res.status} />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {res.quantity} unit(s) &bull; Pickup: <strong>{formatDate(res.pickup_date)}</strong> &bull; Due: <strong>{formatDate(res.return_date)}</strong>
                      </p>
                      {res.purpose && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                          Purpose: "{res.purpose}"
                        </p>
                      )}
                      {res.staff_notes && (
                        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded inline-block">
                          Staff Note: {res.staff_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {canCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                        isLoading={cancellingId === res.id}
                        onClick={() => handleCancel(res.id)}
                      >
                        Cancel Request
                      </Button>
                    )}
                    <Link to={`/catalog/${res.tool_id}`}>
                      <Button variant="ghost" size="sm">
                        View Tool
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

