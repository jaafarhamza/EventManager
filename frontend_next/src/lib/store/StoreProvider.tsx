'use client';

import { useEffect, useMemo } from 'react';
import { Provider } from 'react-redux';
import { makeStore } from './store';
import { setUser, clearUser } from './slices/authSlice';
import { initializeAuth } from '@/lib/auth';

interface StoreProviderProps {
  children: React.ReactNode;
}

export default function StoreProvider({ children }: StoreProviderProps) {
  // Create store
  const store = useMemo(() => makeStore(), []);

  // Initialize auth state from stored tokens
  useEffect(() => {
    const { user, isAuthenticated } = initializeAuth();
    
    if (isAuthenticated && user) {
      store.dispatch(setUser(user));
    } else {
      // Ensure we clear the state if not authenticated
      store.dispatch(clearUser());
    }
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
