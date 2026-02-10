'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to reservations page by default
    router.replace('/dashboard/reservations');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-(--color-primary) border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-(--color-muted-foreground)">Redirection...</p>
      </div>
    </div>
  );
}
