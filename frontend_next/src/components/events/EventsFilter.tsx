'use client';

import { useState } from 'react';
import { Input, Button } from '@/components/ui';
import { EventStatus } from '@/types/api.types';

interface EventsFilterProps {
  onFilterChange: (filters: {
    search: string;
    status: EventStatus | 'ALL';
    dateFilter: 'all' | 'upcoming' | 'past';
  }) => void;
}

export function EventsFilter({ onFilterChange }: EventsFilterProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EventStatus | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({ search: value, status, dateFilter });
  };

  const handleStatusChange = (newStatus: EventStatus | 'ALL') => {
    setStatus(newStatus);
    onFilterChange({ search, status: newStatus, dateFilter });
  };

  const handleDateFilterChange = (newDateFilter: 'all' | 'upcoming' | 'past') => {
    setDateFilter(newDateFilter);
    onFilterChange({ search, status, dateFilter: newDateFilter });
  };

  const handleReset = () => {
    setSearch('');
    setStatus('ALL');
    setDateFilter('upcoming');
    onFilterChange({ search: '', status: 'ALL', dateFilter: 'upcoming' });
  };

  return (
    <div className="bg-(--color-card) border border-(--color-border) rounded-2xl p-6 shadow-lg space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-(--color-foreground)">
          Rechercher
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-(--color-muted-foreground)"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <Input
            type="text"
            placeholder="Rechercher un événement..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Date Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-(--color-foreground)">
          Période
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleDateFilterChange('upcoming')}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                dateFilter === 'upcoming'
                  ? 'bg-(--color-primary) text-(--color-primary-foreground) shadow-md'
                  : 'bg-(--color-muted) text-(--color-muted-foreground) hover:bg-(--color-muted)/80'
              }
            `}
          >
            À venir
          </button>
          <button
            onClick={() => handleDateFilterChange('past')}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                dateFilter === 'past'
                  ? 'bg-(--color-primary) text-(--color-primary-foreground) shadow-md'
                  : 'bg-(--color-muted) text-(--color-muted-foreground) hover:bg-(--color-muted)/80'
              }
            `}
          >
            Passés
          </button>
          <button
            onClick={() => handleDateFilterChange('all')}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                dateFilter === 'all'
                  ? 'bg-(--color-primary) text-(--color-primary-foreground) shadow-md'
                  : 'bg-(--color-muted) text-(--color-muted-foreground) hover:bg-(--color-muted)/80'
              }
            `}
          >
            Tous
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-(--color-foreground)">
          Statut
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleStatusChange('ALL')}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                status === 'ALL'
                  ? 'bg-(--color-primary) text-(--color-primary-foreground) shadow-md'
                  : 'bg-(--color-muted) text-(--color-muted-foreground) hover:bg-(--color-muted)/80'
              }
            `}
          >
            Tous
          </button>
          <button
            onClick={() => handleStatusChange(EventStatus.PUBLISHED)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${
                status === EventStatus.PUBLISHED
                  ? 'bg-(--color-primary) text-(--color-primary-foreground) shadow-md'
                  : 'bg-(--color-muted) text-(--color-muted-foreground) hover:bg-(--color-muted)/80'
              }
            `}
          >
            Publiés
          </button>
        </div>
      </div>

      {/* Reset Button */}
      <Button
        variant="secondary"
        onClick={handleReset}
        className="w-full"
      >
        Réinitialiser les filtres
      </Button>
    </div>
  );
}
