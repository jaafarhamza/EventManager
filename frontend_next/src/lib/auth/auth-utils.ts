import { getAccessToken } from '../api/axios';
import type { UserRole } from '@/types/api.types';

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = getAccessToken();
  return !!token;
}

/**
 * Get user role from cookie
 */
export function getUserRole(): UserRole | null {
  if (typeof window === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const roleCookie = cookies.find((c) => c.trim().startsWith('userRole='));
  
  if (!roleCookie) return null;
  
  const role = roleCookie.split('=')[1];
  return role as UserRole;
}

/**
 * Check if user is admin
 */
export function isAdmin(): boolean {
  return getUserRole() === 'ADMIN';
}

/**
 * Check if user is participant
 */
export function isParticipant(): boolean {
  return getUserRole() === 'PARTICIPANT';
}

/**
 * Decode JWT token
 */
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const expirationTime = (decoded.exp as number) * 1000;
  return Date.now() >= expirationTime;
}

/**
 * Get redirect URL after login
 */
export function getRedirectUrl(): string {
  if (typeof window === 'undefined') return '/';
  
  const params = new URLSearchParams(window.location.search);
  return params.get('redirect') || '/';
}
