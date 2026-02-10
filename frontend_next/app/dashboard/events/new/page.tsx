'use client';

import { useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/api';
import { EventForm } from '@/components/admin';
import type { CreateEventDto } from '@/types/api.types';

export default function NewEventPage() {
  const router = useRouter();

  const handleSubmit = async (data: CreateEventDto) => {
    await eventsApi.create(data);
    router.push('/dashboard/events');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-(family-name:--font-mclaren) font-bold">
          Créer un Événement
        </h1>
        <p className="text-(--color-muted-foreground) mt-1">
          Remplissez les informations de votre événement
        </p>
      </div>

      {/* Form */}
      <div className="bg-(--color-card) border border-(--color-border) rounded-2xl p-6 md:p-8">
        <EventForm onSubmit={handleSubmit} submitLabel="Créer l'événement" />
      </div>
    </div>
  );
}
