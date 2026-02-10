'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/api/error-handler';
import { StatsCard } from '@/components/admin';
import type { DashboardStats } from '@/types/api.types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (isFetchingRef.current) return;

      try {
        isFetchingRef.current = true;
        setLoading(true);
        setError(null);
        const data = await adminApi.getDashboard();
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-(--color-muted) animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-(--color-card) border border-(--color-border) rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-(family-name:--font-mclaren) font-bold">
          Dashboard Admin
        </h1>
        <div className="bg-(--color-destructive)/10 border border-(--color-destructive)/20 rounded-lg p-4">
          <p className="text-sm text-(--color-destructive)">
            {error || 'Impossible de charger les statistiques'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-(family-name:--font-mclaren) font-bold">
          Dashboard Admin
        </h1>
        <p className="text-(--color-muted-foreground) mt-1">
          Vue d&apos;ensemble de la plateforme
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Événements Publiés"
          value={stats.eventsCount.published}
          icon="🎫"
          color="blue"
          subtitle={`${stats.eventsCount.total} au total`}
        />
        <StatsCard
          title="Réservations Confirmées"
          value={stats.reservationsCount.confirmed}
          icon="✅"
          color="green"
          subtitle={`${stats.reservationsCount.total} au total`}
        />
        <StatsCard
          title="Taux de Remplissage"
          value={`${stats.averageFillRate}%`}
          icon="📊"
          color="purple"
          subtitle="Moyenne globale"
        />
        <StatsCard
          title="En Attente"
          value={stats.reservationsCount.pending}
          icon="⏳"
          color="yellow"
          subtitle="Réservations à traiter"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Brouillons"
          value={stats.eventsCount.draft}
          icon="📝"
          color="blue"
          subtitle="Événements non publiés"
        />
        <StatsCard
          title="Refusées"
          value={stats.reservationsCount.refused}
          icon="❌"
          color="red"
          subtitle="Réservations refusées"
        />
        <StatsCard
          title="Annulées"
          value={stats.reservationsCount.canceled}
          icon="🚫"
          color="red"
          subtitle="Réservations annulées"
        />
      </div>

      {/* Upcoming Events */}
      <div className="bg-(--color-card) border border-(--color-border) rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-(--color-foreground)">
            Événements à Venir
          </h2>
          <Link
            href="/dashboard/events"
            className="text-sm text-(--color-primary) hover:underline"
          >
            Voir tous →
          </Link>
        </div>

        {stats.upcomingEvents.length === 0 ? (
          <p className="text-(--color-muted-foreground) text-center py-8">
            Aucun événement à venir
          </p>
        ) : (
          <div className="space-y-3">
            {stats.upcomingEvents.map((event) => (
              <Link
                key={event._id}
                href={`/events/${event._id}`}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-(--color-muted)/30 transition-colors border border-(--color-border)"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-(--color-foreground)">
                    {event.title}
                  </h3>
                  <p className="text-sm text-(--color-muted-foreground)">
                    {event.location}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-(--color-foreground)">
                    {new Date(event.date).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-(--color-muted-foreground)">
                    {event.availableSeats}/{event.capacity} places
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Popular Events */}
      {stats.popularEvents.length > 0 && (
        <div className="bg-(--color-card) border border-(--color-border) rounded-2xl p-6">
          <h2 className="text-2xl font-semibold text-(--color-foreground) mb-6">
            Événements Populaires
          </h2>
          <div className="space-y-3">
            {stats.popularEvents.map((event) => (
              <Link
                key={event._id}
                href={`/events/${event._id}`}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-(--color-muted)/30 transition-colors border border-(--color-border)"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-(--color-foreground)">
                    {event.title}
                  </h3>
                  <p className="text-sm text-(--color-muted-foreground)">
                    {event.reservationsCount} réservations
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-(--color-muted) rounded-full overflow-hidden">
                      <div
                        className="h-full bg-(--color-primary)"
                        style={{ width: `${event.fillRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-(--color-foreground)">
                      {event.fillRate}%
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
