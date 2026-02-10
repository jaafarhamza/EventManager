import { getAccessToken, clearTokens } from '@/lib/api/axios';
import type { User } from '@/types/api.types';

export const initializeAuth = (): { user: User | null; isAuthenticated: boolean } => {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false };
  }

  const accessToken = getAccessToken();
  
  if (!accessToken) {
    // Clear any stale data
    clearTokens();
    return { user: null, isAuthenticated: false };
  }

  try {
    // Decode JWT to get user info
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      // Token expired, clear everything
      clearTokens();
      return { user: null, isAuthenticated: false };
    }
    
    const user: User = {
      id: payload.sub || payload.userId,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
      picture: payload.picture,
      provider: payload.provider,
    };

    return { user, isAuthenticated: true };
  } catch (error) {
    console.error('Failed to decode token:', error);
    clearTokens();
    return { user: null, isAuthenticated: false };
  }
};
