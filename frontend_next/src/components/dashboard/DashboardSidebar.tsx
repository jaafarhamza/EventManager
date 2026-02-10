'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch } from '@/lib/store/hooks';
import { clearUser } from '@/lib/store/slices/authSlice';
import { authApi } from '@/lib/api';
import type { User } from '@/types/api.types';

interface DashboardSidebarProps {
  user: User;
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAdmin = user.role === 'ADMIN';

  const participantLinks = [
    {
      href: '/dashboard/reservations',
      label: 'Mes Réservations',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
  ];

  const adminLinks = [
    {
      href: '/dashboard/admin',
      label: 'Dashboard Admin',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      href: '/dashboard/events',
      label: 'Gérer Événements',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      href: '/dashboard/admin/reservations',
      label: 'Gérer Réservations',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
  ];

  const links = [...participantLinks, ...(isAdmin ? adminLinks : [])];

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await authApi.logout();
      dispatch(clearUser());
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      dispatch(clearUser());
      router.push('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 bg-(--color-card) border-r border-(--color-border) p-6 space-y-8 hidden lg:block">
      {/* User Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-linear-to-br from-(--color-primary) to-(--color-tertiary) flex items-center justify-center">
            <span className="text-lg font-bold text-white">
              {user.firstName[0]}
              {user.lastName[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-(--color-foreground) truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-(--color-muted-foreground) truncate">
              {user.email}
            </p>
          </div>
        </div>
        {isAdmin && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-(--color-primary)/10 text-(--color-primary)">
            Administrateur
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? ' text-(--color-primary-foreground) shadow-md'
                  : 'text-(--color-muted-foreground) hover:bg-(--color-muted) hover:text-(--color-foreground)'
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="space-y-2">
        <Link
          href="/events"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-(--color-muted-foreground) hover:bg-(--color-muted) hover:text-(--color-foreground) transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span>Parcourir les événements</span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-(--color-muted-foreground) hover:bg-(--color-muted) hover:text-(--color-foreground) transition-all"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span>Retour à l&apos;accueil</span>
        </Link>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-(--color-destructive) text-(--color-destructive-foreground) rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoggingOut ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Déconnexion...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Déconnexion</span>
          </>
        )}
      </button>
    </aside>
  );
}
