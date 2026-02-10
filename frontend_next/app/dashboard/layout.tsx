'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '@/lib/store/hooks';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { MobileDashboardMenu } from '@/components/dashboard/MobileDashboardMenu';
import { AnimatedBackground } from '@/components/layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-(--color-primary) border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-(--color-muted-foreground)">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <AnimatedBackground />
      <div className="flex min-h-screen pt-20 pb-20 lg:pb-0">
        <DashboardSidebar user={user} />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <MobileDashboardMenu user={user} />
      </div>
    </>
  );
}
