'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/store/hooks';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Redirect based on user role
    if (user?.role === 'ADMIN') {
      router.replace('/dashboard/admin');
    } else {
      router.replace('/dashboard/reservations');
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-(--color-primary) border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-(--color-muted-foreground)">Redirection...</p>
      </div>
    </div>
  );
}
