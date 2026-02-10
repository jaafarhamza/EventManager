'use client';

import { useState, useMemo } from 'react';
import { Event, EventStatus } from '@/types/api.types';
import { EventCard } from './EventCard';
import { EventsFilter } from './EventsFilter';

interface EventsListProps {
  initialEvents: Event[];
}

export function EventsList({ initialEvents }: EventsListProps) {
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL' as EventStatus | 'ALL',
    dateFilter: 'upcoming' as 'all' | 'upcoming' | 'past',
  });

  const filteredEvents = useMemo(() => {
    let filtered = [...initialEvents];

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          event.location.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (filters.status !== 'ALL') {
      filtered = filtered.filter((event) => event.status === filters.status);
    }

    // Filter by date
    const now = new Date();
    if (filters.dateFilter === 'upcoming') {
      filtered = filtered.filter((event) => new Date(event.date) > now);
    } else if (filters.dateFilter === 'past') {
      filtered = filtered.filter((event) => new Date(event.date) <= now);
    }

    // Sort by date (upcoming first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    return filtered;
  }, [initialEvents, filters]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar - Filters */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24">
            <h2 className="text-xl font-(family-name:--font-mclaren) font-bold text-(--color-foreground) mb-4">
              Filtres
            </h2>
            <EventsFilter onFilterChange={setFilters} />
          </div>
        </aside>

        {/* Main Content - Events Grid */}
        <div className="lg:col-span-3">
          {/* Results count */}
          <div className="mb-6">
            <h2 className="text-2xl font-(family-name:--font-mclaren) font-bold text-(--color-foreground)">
              {filters.dateFilter === 'upcoming' && 'Événements à venir'}
              {filters.dateFilter === 'past' && 'Événements passés'}
              {filters.dateFilter === 'all' && 'Tous les événements'}
            </h2>
            <p className="text-(--color-muted-foreground) mt-1">
              {filteredEvents.length} événement{filteredEvents.length !== 1 ? 's' : ''} trouvé{filteredEvents.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Events Grid */}
          {filteredEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-(--color-muted) mb-4">
                <svg
                  className="w-8 h-8 text-(--color-muted-foreground)"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-(--color-foreground) mb-2">
                Aucun événement trouvé
              </h3>
              <p className="text-(--color-muted-foreground)">
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
