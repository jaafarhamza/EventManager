'use client';

import Link from 'next/link';
import { Event, EventStatus } from '@/types/api.types';
import { Card } from '@/components/ui';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.date);
  const isFull = event.availableSeats === 0;
  const fillRate = ((event.capacity - event.availableSeats) / event.capacity) * 100;

  const getStatusBadge = () => {
    if (event.status === EventStatus.CANCELED) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-(--color-destructive)/10 text-(--color-destructive)">
          Annulé
        </span>
      );
    }
    if (isFull) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-(--color-muted) text-(--color-muted-foreground)">
          Complet
        </span>
      );
    }
    if (fillRate > 80) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-(--color-tertiary)/10 text-(--color-tertiary)">
          Presque complet
        </span>
      );
    }
    return null;
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="p-6 space-y-4">
        {/* Header with status badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-(family-name:--font-mclaren) font-bold text-(--color-foreground) group-hover:text-(--color-primary) transition-colors line-clamp-2">
            {event.title}
          </h3>
          {getStatusBadge()}
        </div>

        {/* Description */}
        <p className="text-(--color-muted-foreground) text-sm line-clamp-3">
          {event.description}
        </p>

        {/* Event details */}
        <div className="space-y-2.5 text-sm">
          {/* Date */}
          <div className="flex items-center gap-2 text-(--color-foreground)">
            <svg
              className="w-4 h-4 text-(--color-primary) shrink-0"
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
            <span className="font-medium">
              {eventDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 text-(--color-foreground)">
            <svg
              className="w-4 h-4 text-(--color-primary) shrink-0"
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

          {/* Location */}
          <div className="flex items-center gap-2 text-(--color-foreground)">
            <svg
              className="w-4 h-4 text-(--color-primary) shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="line-clamp-1">{event.location}</span>
          </div>

          {/* Capacity */}
          <div className="flex items-center gap-2 text-(--color-foreground)">
            <svg
              className="w-4 h-4 text-(--color-primary) shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span>
              <span className={isFull ? 'text-(--color-destructive) font-semibold' : 'font-semibold'}>
                {event.availableSeats}
              </span>
              {' / '}
              {event.capacity} places disponibles
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="w-full bg-(--color-muted) rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                fillRate > 80
                  ? 'bg-(--color-tertiary)'
                  : 'bg-(--color-primary)'
              }`}
              style={{ width: `${fillRate}%` }}
            />
          </div>
          <p className="text-xs text-(--color-muted-foreground) text-right">
            {fillRate.toFixed(0)}% réservé
          </p>
        </div>

        {/* CTA Button */}
        <Link
          href={`/events/${event._id}`}
          className={`
            mt-4 block text-center py-3 px-4 rounded-lg font-medium transition-all duration-200
            ${
              event.status === EventStatus.CANCELED || isFull
                ? 'bg-(--color-muted) text-(--color-muted-foreground) cursor-not-allowed'
                : ' text-white hover:bg-(--color-primary)/50 hover:shadow-lg'
            }
          `}
          aria-disabled={event.status === EventStatus.CANCELED || isFull}
        >
          {event.status === EventStatus.CANCELED
            ? 'Événement annulé'
            : isFull
            ? 'Complet'
            : 'Voir les détails'}
        </Link>
      </div>
    </Card>
  );
}
