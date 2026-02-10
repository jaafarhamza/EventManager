'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/api/error-handler';
import { EventTable } from '@/components/admin';
import type { Event } from '@/types/api.types';

export default function EventsManagementPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      const data = await eventsApi.getAll();
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await eventsApi.publish(id);
      await fetchEvents();
    } catch (err) {
      console.error('Error publishing event:', err);
      alert(`Erreur: ${getErrorMessage(err)}`);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await eventsApi.cancel(id);
      await fetchEvents();
    } catch (err) {
      console.error('Error canceling event:', err);
      alert(`Erreur: ${getErrorMessage(err)}`);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/events/${id}/edit`);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-(family-name:--font-mclaren) font-bold">
            Gestion des Événements
          </h1>
          <p className="text-(--color-muted-foreground) mt-1">
            Créez et gérez vos événements
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/events/new')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-(--color-primary) text-(--color-primary-foreground) rounded-xl hover:opacity-90 transition-opacity shadow-md"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nouvel Événement
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-(--color-destructive)/10 border border-(--color-destructive)/20 rounded-lg p-4">
          <p className="text-sm text-(--color-destructive)">{error}</p>
        </div>
      )}

      {/* Events Table */}
      <EventTable
        events={events}
        onPublish={handlePublish}
        onCancel={handleCancel}
        onEdit={handleEdit}
      />
    </div>
  );
}
