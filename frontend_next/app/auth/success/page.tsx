'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/lib/store/hooks';
import { setUser, setLoading } from '@/lib/store/slices/authSlice';
import { setTokens } from '@/lib/api/axios';

export default function AuthSuccessPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      dispatch(setLoading(true));
      
      try {
        // Fetch tokens from server-side API route
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to get session');
        }

        const { accessToken, refreshToken } = await response.json();

        if (!accessToken || !refreshToken) {
          throw new Error('No tokens found');
        }

        // Decode JWT to get user info
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        
        const user = {
          id: payload.sub || payload.userId,
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
          role: payload.role,
          picture: payload.picture,
          provider: payload.provider,
        };

        // Store tokens in localStorage and cookies
        setTokens(accessToken, refreshToken, user.role);

        // Update Redux state
        dispatch(setUser(user));
        
        // Redirect to home
        router.push('/');
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        setError('Authentication failed. Please try again.');
        
        setTimeout(() => {
          router.push('/login?error=auth_failed');
        }, 2000);
      } finally {
        dispatch(setLoading(false));
      }
    };

    initializeAuth();
  }, [dispatch, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-(--color-destructive)/10 mb-4">
            <svg
              className="w-8 h-8 text-(--color-destructive)"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-(family-name:--font-mclaren) font-bold text-(--color-foreground) mb-2">
            Authentication Failed
          </h1>
          <p className="text-(--color-muted-foreground)">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-(--color-primary) to-(--color-tertiary) mb-4 animate-pulse">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-(family-name:--font-mclaren) font-bold text-(--color-foreground) mb-2">
          Authentication Successful
        </h1>
        <p className="text-(--color-muted-foreground)">
          Redirecting you to the app...
        </p>
      </div>
    </div>
  );
}
