'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch } from '@/lib/store/hooks';
import { clearUser } from '@/lib/store/slices/authSlice';
import { authApi } from '@/lib/api';
import type { User } from '@/types/api.types';

interface MobileDashboardMenuProps {
  user: User;
}

export function MobileDashboardMenu({ user }: MobileDashboardMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-(--color-card) border-t border-(--color-border) shadow-lg">
      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-up Menu */}
      <div
        className={`absolute bottom-full left-0 right-0 bg-(--color-card) border-t border-(--color-border) transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-(--color-muted) rounded-lg mb-4">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-(--color-primary) to-(--color-tertiary) flex items-center justify-center">
              <span className="text-sm font-bold text-white">
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

          {/* Navigation Links */}
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-(--color-primary) text-(--color-primary-foreground)'
                    : 'text-(--color-muted-foreground) hover:bg-(--color-muted)'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* Quick Links */}
          <div className="pt-2 border-t border-(--color-border) space-y-2">
            <Link
              href="/events"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-(--color-muted-foreground) hover:bg-(--color-muted)"
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
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-(--color-muted-foreground) hover:bg-(--color-muted)"
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
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-(--color-destructive) text-(--color-destructive-foreground) rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
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
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="flex items-center justify-around p-2">
        <Link
          href="/dashboard/reservations"
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
            pathname === '/dashboard/reservations'
              ? 'text-(--color-primary)'
              : 'text-(--color-muted-foreground)'
          }`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span className="text-xs font-medium">Réservations</span>
        </Link>

        <Link
          href="/events"
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-(--color-muted-foreground) transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs font-medium">Événements</span>
        </Link>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-(--color-muted-foreground) transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <span className="text-xs font-medium">Menu</span>
        </button>
      </div>
    </div>
  );
}
