'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/store/hooks';
import { isAuthenticated } from '@/lib/auth/auth-utils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated: isAuthRedux } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Check authentication
    if (!isAuthRedux && !isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Check admin requirement
    if (requireAdmin && user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [isAuthRedux, user, requireAdmin, router]);

  // Show loading or nothing while checking auth
  if (!isAuthRedux || (requireAdmin && user?.role !== 'ADMIN')) {
    return null;
  }

  return <>{children}</>;
}
