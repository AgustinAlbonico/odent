import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@sistema-odontologico/auth-core';
import {
  AUTHORIZED_ROUTES_COOKIE,
  isAuthorizedProtectedRoute,
  parseAuthorizedRoutesCookie,
  parseLandingPathCookie,
  resolveAuthorizedLandingPath,
  resolveRoleFallbackLanding,
} from './lib/auth/routing';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split('.');
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Next.js middleware — guards routes based on auth state.
 *
 * Protected routes (dashboard, settings, etc.) require a valid session.
 * Auth routes (/login, /forgot-password, etc.) redirect to dashboard if already logged in.
 * Users with mustChangePassword are forced to /forced-password-change.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read the auth token from cookies (set by the API as httpOnly)
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const payload = accessToken ? decodeJwtPayload(accessToken) : null;
  const mustChangePassword = payload?.mustChangePassword === true;
  const isAuthenticated = !!accessToken;
  const preferredLandingPath =
    parseLandingPathCookie(request.cookies.get('so_landing_path')?.value) ??
    resolveRoleFallbackLanding(typeof payload?.role === 'string' ? payload.role : undefined);
  const authorizedRoutes = parseAuthorizedRoutesCookie(
    request.cookies.get(AUTHORIZED_ROUTES_COOKIE)?.value,
  );

  // ----------------------------------------------------------------
  // Auth routes — redirect to dashboard if already authenticated
  // ----------------------------------------------------------------
  const authRoutes = ['/login', '/forgot-password', '/reset-password'];
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  if (isAuthRoute && isAuthenticated && !mustChangePassword) {
    return NextResponse.redirect(new URL(preferredLandingPath, request.url));
  }

  // ----------------------------------------------------------------
  // Forced password change — trap authenticated users until they change
  // ----------------------------------------------------------------
  if (mustChangePassword && pathname !== '/forced-password-change') {
    return NextResponse.redirect(new URL('/forced-password-change', request.url));
  }

  // ----------------------------------------------------------------
  // Protected routes — redirect to login if not authenticated
  // ----------------------------------------------------------------
  const publicRoutes = ['/', '/login', '/forgot-password', '/reset-password', '/forced-password-change'];
  const isPublicRoute = publicRoutes.some(
    (r) => pathname === r || (r !== '/' && pathname.startsWith(r)),
  );

  if (!isPublicRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (
    isAuthenticated &&
    authorizedRoutes.size > 0 &&
    !isAuthorizedProtectedRoute(pathname, authorizedRoutes)
  ) {
    const landingPath = resolveAuthorizedLandingPath(
      typeof payload?.role === 'string' ? payload.role : undefined,
      authorizedRoutes,
      preferredLandingPath,
    );

    if (landingPath !== pathname) {
      return NextResponse.redirect(new URL(landingPath, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static assets)
     * - _next/image (image optimization)
     * - favicon.ico, etc.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
