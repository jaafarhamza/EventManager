'use client';

import { useAppSelector } from '@/lib/store/hooks';
import type { UserRole } from '@/types/api.types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return fallback || null;
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback || null;
  }

  return <>{children}</>;
}
