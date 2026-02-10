'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import type { Reservation, ReservationStatus } from '@/types/api.types';

interface ReservationCardProps {
  reservation: Reservation;
  onCancel: (id: string, reason?: string) => Promise<void>;
  onDownloadTicket: (id: string) => Promise<void>;
}

export function ReservationCard({
  reservation,
  onCancel,
  onDownloadTicket,
}: ReservationCardProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // Handle both populated and non-populated eventId
  const event = typeof reservation.eventId === 'string' 
    ? null 
    : reservation.eventId;

  if (!event) {
    return null;
  }

  const eventDate = new Date(event.date);
  const isPastEvent = eventDate < new Date();
  const canCancel = ['PENDING', 'CONFIRMED'].includes(reservation.status) && !isPastEvent;
  const canDownload = reservation.status === 'CONFIRMED';

  const getStatusInfo = (status: ReservationStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return {
          label: 'Confirmée',
          color: 'text-(--color-tertiary)',
          bgColor: 'bg-(--color-tertiary)/10',
          borderColor: 'border-(--color-tertiary)/20',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        };
      case 'PENDING':
        return {
          label: 'En attente',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        };
      case 'REFUSED':
        return {
          label: 'Refusée',
          color: 'text-(--color-destructive)',
          bgColor: 'bg-(--color-destructive)/10',
          borderColor: 'border-(--color-destructive)/20',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        };
      case 'CANCELED':
        return {
          label: 'Annulée',
          color: 'text-(--color-muted-foreground)',
          bgColor: 'bg-(--color-muted)',
          borderColor: 'border-(--color-border)',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          ),
        };
      default:
        return {
          label: status,
          color: 'text-(--color-muted-foreground)',
          bgColor: 'bg-(--color-muted)',
          borderColor: 'border-(--color-border)',
          icon: null,
        };
    }
  };

  const statusInfo = getStatusInfo(reservation.status);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownloadTicket(reservation._id);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCancelSubmit = async () => {
    setIsCanceling(true);
    try {
      await onCancel(reservation._id, cancelReason || undefined);
      setShowCancelModal(false);
      setCancelReason('');
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Link
                href={`/events/${event._id}`}
                className="text-xl font-(family-name:--font-mclaren) font-bold text-(--color-foreground) hover:text-(--color-primary) transition-colors line-clamp-2"
              >
                {event.title}
              </Link>
              <p className="text-(--color-muted-foreground) mt-1 line-clamp-1">
                {event.location}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor} shrink-0`}
            >
              {statusInfo.icon}
              {statusInfo.label}
            </span>
          </div>

          {/* Event Details */}
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-(--color-foreground)">
              <svg
                className="w-5 h-5 text-(--color-primary) shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>
                {eventDate.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-(--color-foreground)">
              <svg
                className="w-5 h-5 text-(--color-primary) shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                {eventDate.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Reservation Info */}
          <div className="pt-4 border-t border-(--color-border) text-xs text-(--color-muted-foreground)">
            <p>
              Réservé le{' '}
              {new Date(reservation.createdAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            {reservation.canceledAt && (
              <p className="mt-1">
                Annulé le{' '}
                {new Date(reservation.canceledAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
            {reservation.cancelReason && (
              <p className="mt-1 text-(--color-destructive)">
                Raison: {reservation.cancelReason}
              </p>
            )}
          </div>

          {/* Actions */}
          {(canDownload || canCancel) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {canDownload && (
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-4 py-2 bg-(--color-primary) text-(--color-primary-foreground) rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Téléchargement...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>Télécharger le ticket</span>
                    </>
                  )}
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-(--color-destructive) text-(--color-destructive) rounded-lg hover:bg-(--color-destructive)/10 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span>Annuler la réservation</span>
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-(--color-card) border border-(--color-border) rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-(family-name:--font-mclaren) font-bold text-(--color-foreground) mb-4">
              Annuler la réservation
            </h3>
            <p className="text-(--color-muted-foreground) mb-4">
              Êtes-vous sûr de vouloir annuler votre réservation pour{' '}
              <strong className="text-(--color-foreground)">{event.title}</strong> ?
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-(--color-foreground) mb-2">
                Raison (optionnel)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Pourquoi annulez-vous cette réservation ?"
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-(--color-border) bg-(--color-input) text-(--color-foreground) placeholder:text-(--color-muted-foreground) focus:outline-none focus:ring-2 focus:ring-(--color-ring)"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={isCanceling}
                className="flex-1 px-4 py-2 border border-(--color-border) text-(--color-foreground) rounded-lg hover:bg-(--color-muted) transition-colors disabled:opacity-50"
              >
                Retour
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={isCanceling}
                className="flex-1 px-4 py-2 bg-(--color-destructive) text-(--color-destructive-foreground) rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCanceling ? 'Annulation...' : 'Confirmer l\'annulation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
