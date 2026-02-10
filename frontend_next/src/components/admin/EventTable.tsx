'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Event } from '@/types/api.types';

interface EventTableProps {
  events: Event[];
  onPublish: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onEdit: (id: string) => void;
}

const statusConfig = {
  DRAFT: {
    label: 'Brouillon',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
  PUBLISHED: {
    label: 'Publié',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  CANCELED: {
    label: 'Annulé',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
};

export function EventTable({ events, onPublish, onCancel, onEdit }: EventTableProps) {
  const [filter, setFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'CANCELED'>('ALL');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredEvents = filter === 'ALL' 
    ? events 
    : events.filter(event => event.status === filter);

  const handlePublish = async (id: string) => {
    setLoadingId(id);
    try {
      await onPublish(id);
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cet événement ?')) return;
    setLoadingId(id);
    try {
      await onCancel(id);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'ALL'
              ? 'bg-(--color-primary) text-(--color-primary-foreground) shadow-md'
              : 'bg-(--color-muted) text-(--color-muted-foreground) hover:bg-(--color-muted)/80'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setFilter('DRAFT')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'DRAFT'
              ? 'bg-(--color-primary) text-(--color-primary-foreground) shadow-md'
              : 'bg-(--color-muted) text-(--color-muted-foreground) hover:bg-(--color-muted)/80'
          }`}
        >
          Brouillons
        </button>
        <button
          onClick={() => setFilter('PUBLISHED')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'PUBLISHED'
              ? 'bg-(--color-primary) text-(--color-primary-foreground) shadow-md'
              : 'bg-(--color-muted) text-(--color-muted-foreground) hover:bg-(--color-muted)/80'
          }`}
        >
          Publiés
        </button>
        <button
          onClick={() => setFilter('CANCELED')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'CANCELED'
              ? 'bg-(--color-primary) text-(--color-primary-foreground) shadow-md'
              : 'bg-(--color-muted) text-(--color-muted-foreground) hover:bg-(--color-muted)/80'
          }`}
        >
          Annulés
        </button>
      </div>

      {/* Table */}
      <div className="bg-(--color-card) border border-(--color-border) rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-(--color-muted)/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-(--color-muted-foreground) uppercase tracking-wider">
                  Événement
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-(--color-muted-foreground) uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-(--color-muted-foreground) uppercase tracking-wider">
                  Lieu
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-(--color-muted-foreground) uppercase tracking-wider">
                  Capacité
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
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-(--color-muted-foreground)">
                    Aucun événement trouvé
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event._id} className="hover:bg-(--color-muted)/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <Link 
                          href={`/events/${event._id}`}
                          className="font-medium text-(--color-foreground) hover:text-(--color-primary) transition-colors"
                        >
                          {event.title}
                        </Link>
                        <p className="text-sm text-(--color-muted-foreground) line-clamp-1">
                          {event.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-(--color-foreground) whitespace-nowrap">
                      {new Date(event.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-(--color-foreground)">
                      {event.location}
                    </td>
                    <td className="px-6 py-4 text-sm text-(--color-foreground)">
                      <div className="flex items-center gap-2">
                        <span>{event.availableSeats}/{event.capacity}</span>
                        <div className="w-16 h-2 bg-(--color-muted) rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-(--color-primary)"
                            style={{ width: `${((event.capacity - event.availableSeats) / event.capacity) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[event.status].className}`}>
                        {statusConfig[event.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {event.status === 'DRAFT' && (
                          <button
                            onClick={() => handlePublish(event._id)}
                            disabled={loadingId === event._id}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {loadingId === event._id ? '...' : 'Publier'}
                          </button>
                        )}
                        {event.status === 'PUBLISHED' && (
                          <button
                            onClick={() => handleCancel(event._id)}
                            disabled={loadingId === event._id}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {loadingId === event._id ? '...' : 'Annuler'}
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(event._id)}
                          className="px-3 py-1.5 bg-(--color-primary) text-(--color-primary-foreground) rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Modifier
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
