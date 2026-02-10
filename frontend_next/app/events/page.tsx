import { Metadata } from 'next';
import { EventsList } from '@/components/events';
import type { Event } from '@/types/api.types';

export const metadata: Metadata = {
  title: 'Événements | Event Management System',
  description: 'Découvrez tous les événements disponibles et réservez votre place',
};

// Server-side data fetching
async function getEvents(): Promise<Event[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${API_URL}/events`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to fetch events:', response.statusText);
      return [];
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <main className="min-h-screen pt-20">
      {/* Page Header */}
      <section className="bg-linear-to-br from-(--color-primary)/10 to-(--color-tertiary)/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-(family-name:--font-mclaren) font-bold text-(--color-foreground) mb-4">
            Découvrez nos événements
          </h1>
          <p className="text-lg text-(--color-muted-foreground) max-w-2xl mx-auto">
            Parcourez notre sélection d&apos;événements et réservez votre place en quelques clics
          </p>
        </div>
      </section>

      {/* Events List with Client-side filtering */}
      <EventsList initialEvents={events} />
    </main>
  );
}
