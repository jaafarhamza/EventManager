'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/lib/store/hooks';
import { addReservation } from '@/lib/store/slices/reservationsSlice';
import { reservationsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/api/error-handler';
import { Button } from '@/components/ui';
import { Event, EventStatus } from '@/types/api.types';

interface ReserveButtonProps {
  event: Event;
}

export function ReserveButton({ event }: ReserveButtonProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isFull = event.availableSeats === 0;
  const isCanceled = event.status === EventStatus.CANCELED;
  const isDisabled = isFull || isCanceled;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleReserve = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/events/${event._id}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const reservation = await reservationsApi.create({
        eventId: event._id,
      });

      dispatch(addReservation(reservation));
      setSuccess(true);

      // Show success message and stay on page
      setTimeout(() => {
        // Refresh the page to show updated data
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Reservation error:', err);
      const errorMsg = getErrorMessage(err);
      // Handle duplicate reservation error
      if (errorMsg.includes('409') || errorMsg.includes('already') || errorMsg.includes('duplicate')) {
        setError('Vous avez déjà une réservation pour cet événement.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-(--color-tertiary)/10 border border-(--color-tertiary)/20 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-(--color-tertiary) shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-(--color-tertiary) mb-1">
              Réservation confirmée !
            </h3>
            <p className="text-sm text-(--color-foreground)">
              Votre réservation a été enregistrée avec succès.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-(--color-destructive)/10 border border-(--color-destructive)/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-(--color-destructive) shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-(--color-destructive)">{error}</p>
          </div>
        </div>
      )}

      <Button
        onClick={handleReserve}
        disabled={isDisabled || isLoading}
        isLoading={isLoading}
        variant="primary"
        className="w-full text-lg py-4"
      >
        {isLoading
          ? 'Réservation en cours...'
          : isCanceled
          ? 'Événement annulé'
          : isFull
          ? 'Complet'
          : !mounted
          ? 'Réserver une place'
          : isAuthenticated
          ? 'Réserver une place'
          : 'Se connecter pour réserver'}
      </Button>

      {mounted && !isAuthenticated && (
        <p className="text-sm text-(--color-muted-foreground) text-center">
          Vous devez être connecté pour réserver
        </p>
      )}
    </div>
  );
}
