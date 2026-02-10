import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route patterns
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];
const ADMIN_ROUTES = ['/admin'];
const PROTECTED_ROUTES = ['/events', '/reservations', '/profile'];

/**
 * Check if user is authenticated by verifying token existence
 */
function isAuthenticated(request: NextRequest): boolean {
  const accessToken = request.cookies.get('accessToken')?.value;
  const localStorageToken = request.headers.get('authorization')?.replace('Bearer ', '');
  
  return !!(accessToken || localStorageToken);
}

/**
 * Get user role from token
 */
function getUserRole(request: NextRequest): string | null {
  return request.cookies.get('userRole')?.value || null;
}

/**
 * Check if route matches any pattern
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const isAuth = isAuthenticated(request);
  const userRole = getUserRole(request);
  const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);
  const isAdminRoute = matchesRoute(pathname, ADMIN_ROUTES);
  const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES);

  // Redirect authenticated users away from auth pages
  if (isAuth && isAuthRoute) {
    const redirectUrl = new URL('/', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect unauthenticated users to login
  if (!isAuth && (isProtectedRoute || isAdminRoute)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin access
  if (isAdminRoute && userRole !== 'ADMIN') {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Add security headers
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
