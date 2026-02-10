import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ReserveButton } from '@/components/events';
import type { Event } from '@/types/api.types';

// Server-side data fetching for single event
async function getEvent(id: string): Promise<Event | null> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${API_URL}/events/${id}`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    return {
      title: 'Événement introuvable',
    };
  }

  return {
    title: `${event.title} | Event Management System`,
    description: event.description,
    openGraph: {
      title: event.title,
      description: event.description,
      type: 'website',
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    notFound();
  }

  const eventDate = new Date(event.date);
  const isFull = event.availableSeats === 0;
  const fillRate = ((event.capacity - event.availableSeats) / event.capacity) * 100;

  const getStatusInfo = () => {
    if (event.status === 'CANCELED') {
      return {
        label: 'Événement annulé',
        color: 'text-(--color-destructive)',
        bgColor: 'bg-(--color-destructive)/10',
        borderColor: 'border-(--color-destructive)/20',
      };
    }
    if (isFull) {
      return {
        label: 'Complet',
        color: 'text-(--color-muted-foreground)',
        bgColor: 'bg-(--color-muted)',
        borderColor: 'border-(--color-border)',
      };
    }
    if (event.status === 'PUBLISHED') {
      return {
        label: 'Ouvert aux réservations',
        color: 'text-(--color-tertiary)',
        bgColor: 'bg-(--color-tertiary)/10',
        borderColor: 'border-(--color-tertiary)/20',
      };
    }
    return {
      label: 'Brouillon',
      color: 'text-(--color-muted-foreground)',
      bgColor: 'bg-(--color-muted)',
      borderColor: 'border-(--color-border)',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <main className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-(--color-muted-foreground)">
          <Link href="/" className="hover:text-(--color-primary) transition-colors">
            Accueil
          </Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href="/events" className="hover:text-(--color-primary) transition-colors">
            Événements
          </Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-(--color-foreground) font-medium">{event.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Header */}
            <div className="bg-(--color-card) border border-(--color-border) rounded-2xl p-8 shadow-lg">
              <div className="flex items-start justify-between gap-4 mb-6">
                <h1 className="text-3xl md:text-4xl font-(family-name:--font-mclaren) font-bold text-(--color-foreground)">
                  {event.title}
                </h1>
                <span
                  className={`
                    inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shrink-0
                    ${statusInfo.bgColor} ${statusInfo.color} border ${statusInfo.borderColor}
                  `}
                >
                  {statusInfo.label}
                </span>
              </div>

              {/* Event Details Grid */}
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                {/* Date */}
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-(--color-primary)/10 shrink-0">
                    <svg
                      className="w-5 h-5 text-(--color-primary)"
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
                  </div>
                  <div>
                    <p className="text-sm text-(--color-muted-foreground) mb-1">Date</p>
                    <p className="font-semibold text-(--color-foreground)">
                      {eventDate.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-(--color-primary)/10 shrink-0">
                    <svg
                      className="w-5 h-5 text-(--color-primary)"
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
                  </div>
                  <div>
                    <p className="text-sm text-(--color-muted-foreground) mb-1">Heure</p>
                    <p className="font-semibold text-(--color-foreground)">
                      {eventDate.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-(--color-primary)/10 shrink-0">
                    <svg
                      className="w-5 h-5 text-(--color-primary)"
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
                  </div>
                  <div>
                    <p className="text-sm text-(--color-muted-foreground) mb-1">Lieu</p>
                    <p className="font-semibold text-(--color-foreground)">{event.location}</p>
                  </div>
                </div>

                {/* Capacity */}
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-(--color-primary)/10 shrink-0">
                    <svg
                      className="w-5 h-5 text-(--color-primary)"
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
                  </div>
                  <div>
                    <p className="text-sm text-(--color-muted-foreground) mb-1">Capacité</p>
                    <p className="font-semibold text-(--color-foreground)">
                      {event.capacity} personnes
                    </p>
                  </div>
                </div>
              </div>

              {/* Availability Progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-(--color-muted-foreground)">Places disponibles</span>
                  <span className="font-semibold text-(--color-foreground)">
                    {event.availableSeats} / {event.capacity}
                  </span>
                </div>
                <div className="w-full bg-(--color-muted) rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      fillRate > 80 ? 'bg-(--color-tertiary)' : 'bg-(--color-primary)'
                    }`}
                    style={{ width: `${fillRate}%` }}
                  />
                </div>
                <p className="text-xs text-(--color-muted-foreground)">
                  {fillRate.toFixed(0)}% de places réservées
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-(--color-card) border border-(--color-border) rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-(family-name:--font-mclaren) font-bold text-(--color-foreground) mb-4">
                À propos de cet événement
              </h2>
              <p className="text-(--color-foreground) leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          </div>

          {/* Sidebar - Reservation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Reservation Card */}
              <div className="bg-(--color-card) border border-(--color-border) rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-(family-name:--font-mclaren) font-bold text-(--color-foreground) mb-6">
                  Réservation
                </h3>
                <ReserveButton event={event} />
              </div>

              {/* Info Card */}
              <div className="bg-(--color-primary)/5 border border-(--color-primary)/20 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-(--color-primary) shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-(--color-foreground) mb-2">
                      Informations importantes
                    </h4>
                    <ul className="text-sm text-(--color-muted-foreground) space-y-2">
                      <li>• Réservation gratuite</li>
                      <li>• Confirmation immédiate</li>
                      <li>• Annulation possible</li>
                      <li>• Billet électronique</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
