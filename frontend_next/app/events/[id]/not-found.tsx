import Link from 'next/link';
import { Button } from '@/components/ui';

export default function EventNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-(--color-destructive)/10 mb-6">
          <svg
            className="w-10 h-10 text-(--color-destructive)"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-(family-name:--font-mclaren) font-bold text-(--color-foreground) mb-4">
          Événement introuvable
        </h1>
        <p className="text-(--color-muted-foreground) mb-8">
          Désolé, l&apos;événement que vous recherchez n&apos;existe pas ou a été supprimé.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/events">
            <Button variant="primary">
              Voir tous les événements
            </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">
              Retour à l&apos;accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
