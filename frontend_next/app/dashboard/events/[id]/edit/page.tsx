'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { eventsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/api/error-handler';
import { EventForm } from '@/components/admin';
import type { Event, CreateEventDto } from '@/types/api.types';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (isFetchingRef.current) return;

      try {
        isFetchingRef.current = true;
        setLoading(true);
        setError(null);
        const data = await eventsApi.getById(eventId);
        setEvent(data);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleSubmit = async (data: CreateEventDto) => {
    await eventsApi.update(eventId, data);
    router.push('/dashboard/events');
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-10 w-64 bg-(--color-muted) animate-pulse rounded" />
        <div className="h-96 bg-(--color-card) border border-(--color-border) rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-(family-name:--font-mclaren) font-bold">
          Modifier l&apos;Événement
        </h1>
        <div className="bg-(--color-destructive)/10 border border-(--color-destructive)/20 rounded-lg p-4">
          <p className="text-sm text-(--color-destructive)">
            {error || 'Événement introuvable'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-(family-name:--font-mclaren) font-bold">
          Modifier l&apos;Événement
        </h1>
        <p className="text-(--color-muted-foreground) mt-1">
          Mettez à jour les informations de votre événement
        </p>
      </div>

      {/* Form */}
      <div className="bg-(--color-card) border border-(--color-border) rounded-2xl p-6 md:p-8">
        <EventForm
          initialData={event}
          onSubmit={handleSubmit}
          submitLabel="Enregistrer les modifications"
        />
      </div>
    </div>
  );
}
