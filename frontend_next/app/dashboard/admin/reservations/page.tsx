'use client';

import { useState, useEffect, useRef } from 'react';
import { reservationsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/api/error-handler';
import type { Reservation } from '@/types/api.types';

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'REFUSED' | 'CANCELED'>('PENDING');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      const data = await reservationsApi.getAll();
      setReservations(data);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleConfirm = async (id: string) => {
    setActionLoading(id);
    try {
      await reservationsApi.confirm(id);
      await fetchReservations();
    } catch (err) {
      console.error('Error confirming reservation:', err);
      alert(`Erreur: ${getErrorMessage(err)}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefuse = async (id: string) => {
    const reason = prompt('Raison du refus (optionnel):');
    if (reason === null) return; // User cancelled

    setActionLoading(id);
    try {
      await reservationsApi.refuse(id, { reason: reason || 'Non spécifié' });
      await fetchReservations();
    } catch (err) {
      console.error('Error refusing reservation:', err);
      alert(`Erreur: ${getErrorMessage(err)}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReservations = filter === 'ALL'
    ? reservations
    : reservations.filter(r => r.status === filter);

  const statusConfig = {
    PENDING: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    CONFIRMED: { label: 'Confirmée', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    REFUSED: { label: 'Refusée', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    CANCELED: { label: 'Annulée', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-(--color-muted) animate-pulse rounded" />
        <div className="h-96 bg-(--color-card) border border-(--color-border) rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-(family-name:--font-mclaren) font-bold">
          Gestion des Réservations
        </h1>
        <p className="text-(--color-muted-foreground) mt-1">
          Confirmez ou refusez les réservations
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('PENDING')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'PENDING'
              ? 'bg-(--color-primary) text-(--color-primary-foreground) shadow-md'
              : 'bg-(--color-muted) text-(--color-muted-foreground) hover:bg-(--color-muted)/80'
          }`}
        >
          En attente ({reservations.filter(r => r.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setFilter('CONFIRMED')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'CONFIRMED'
              ? 'bg-(--color-primary) text-(--color-primary-foreground) shadow-md'
              : 'bg-(--color-muted) text-(--color-muted-foreground) hover:bg-(--color-muted)/80'
          }`}
        >
          Confirmées ({reservations.filter(r => r.status === 'CONFIRMED').length})
        </button>
        <button
          onClick={() => setFilter('REFUSED')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'REFUSED'
              ? 'bg-(--color-primary) text-(--color-primary-foreground) shadow-md'
              : 'bg-(--color-muted) text-(--color-muted-foreground) hover:bg-(--color-muted)/80'
          }`}
        >
          Refusées ({reservations.filter(r => r.status === 'REFUSED').length})
        </button>
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'ALL'
              ? 'bg-(--color-primary) text-(--color-primary-foreground) shadow-md'
              : 'bg-(--color-muted) text-(--color-muted-foreground) hover:bg-(--color-muted)/80'
          }`}
        >
          Toutes ({reservations.length})
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-(--color-destructive)/10 border border-(--color-destructive)/20 rounded-lg p-4">
          <p className="text-sm text-(--color-destructive)">{error}</p>
        </div>
      )}

      {/* Reservations Table */}
      <div className="bg-(--color-card) border border-(--color-border) rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-(--color-muted)/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-(--color-muted-foreground) uppercase tracking-wider">
                  Participant
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-(--color-muted-foreground) uppercase tracking-wider">
                  Événement
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-(--color-muted-foreground) uppercase tracking-wider">
                  Date Réservation
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-(--color-muted-foreground) uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-(--color-muted-foreground) uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-(--color-muted-foreground)">
                    Aucune réservation trouvée
                  </td>
                </tr>
              ) : (
                filteredReservations.map((reservation) => {
                  const user = typeof reservation.userId === 'object' ? reservation.userId : null;
                  const event = typeof reservation.eventId === 'object' ? reservation.eventId : null;

                  return (
                    <tr key={reservation._id} className="hover:bg-(--color-muted)/30 transition-colors">
                      <td className="px-6 py-4">
                        {user ? (
                          <div>
                            <p className="font-medium text-(--color-foreground)">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-(--color-muted-foreground)">
                              {user.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-(--color-muted-foreground)">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {event ? (
                          <div>
                            <p className="font-medium text-(--color-foreground)">
                              {event.title}
                            </p>
                            <p className="text-sm text-(--color-muted-foreground)">
                              {new Date(event.date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        ) : (
                          <span className="text-(--color-muted-foreground)">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-(--color-foreground)">
                        {new Date(reservation.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[reservation.status].className}`}>
                          {statusConfig[reservation.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {reservation.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleConfirm(reservation._id)}
                              disabled={actionLoading === reservation._id}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === reservation._id ? '...' : 'Confirmer'}
                            </button>
                            <button
                              onClick={() => handleRefuse(reservation._id)}
                              disabled={actionLoading === reservation._id}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === reservation._id ? '...' : 'Refuser'}
                            </button>
                          </div>
                        )}
                        {reservation.status === 'REFUSED' && reservation.cancelReason && (
                          <p className="text-xs text-(--color-muted-foreground) italic">
                            Raison: {reservation.cancelReason}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
