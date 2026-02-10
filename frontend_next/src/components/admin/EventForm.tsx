'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import type { CreateEventDto, Event } from '@/types/api.types';

interface EventFormProps {
  initialData?: Event;
  onSubmit: (data: CreateEventDto) => Promise<void>;
  submitLabel?: string;
}

export function EventForm({ initialData, onSubmit, submitLabel = 'Créer' }: EventFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateEventDto>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    date: initialData?.date ? new Date(initialData.date).toISOString().slice(0, 16) : '',
    location: initialData?.location || '',
    capacity: initialData?.capacity || 50,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string | string[] } } };
        const messages = axiosError.response?.data?.message;
        if (Array.isArray(messages)) {
          const errorObj: Record<string, string> = {};
          messages.forEach((msg: string) => {
            const field = msg.split(' ')[0].toLowerCase();
            errorObj[field] = msg;
          });
          setErrors(errorObj);
        } else if (messages) {
          setErrors({ general: messages });
        } else {
          setErrors({ general: 'Une erreur est survenue' });
        }
      } else {
        setErrors({ general: 'Une erreur est survenue' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-300">{errors.general}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Titre de l&apos;événement *</Label>
        <Input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ex: Conférence Tech 2024"
          required
          className={errors.title ? 'border-red-500' : ''}
        />
        {errors.title && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Décrivez votre événement..."
          rows={5}
          required
          className="w-full px-4 py-3 bg-(--color-background) border border-(--color-border) rounded-xl text-(--color-foreground) placeholder:text-(--color-muted-foreground) focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-transparent transition-all resize-none"
        />
        {errors.description && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="date">Date et heure *</Label>
          <Input
            id="date"
            type="datetime-local"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            className={errors.date ? 'border-red-500' : ''}
          />
          {errors.date && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.date}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">Capacité *</Label>
          <Input
            id="capacity"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
            min="1"
            max="10000"
            required
            className={errors.capacity ? 'border-red-500' : ''}
          />
          {errors.capacity && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.capacity}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Lieu *</Label>
        <Input
          id="location"
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Ex: Centre de Conférences, Paris"
          required
          className={errors.location ? 'border-red-500' : ''}
        />
        {errors.location && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.location}</p>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'En cours...' : submitLabel}
        </Button>
        <Button
          type="button"
          onClick={() => router.back()}
          variant="outline"
          className="flex-1"
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
