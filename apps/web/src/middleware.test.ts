import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@sistema-odontologico/auth-core';
import { BaseRole, DEFAULT_ROLE_PERMISSIONS } from '@sistema-odontologico/permissions';
import { middleware } from './middleware';
import {
  AUTHORIZED_ROUTES_COOKIE,
  LANDING_PATH_COOKIE,
  getAuthorizedProtectedPaths,
} from './lib/auth/routing';

function createJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

describe('auth middleware runtime contract', () => {
  it('detects forced password change from the canonical access_token cookie', () => {
    const token = createJwt({ mustChangePassword: true });
    const request = new NextRequest('http://localhost:3000/dashboard', {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${token}`,
      },
    });

    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/forced-password-change');
  });

  it('redirects unauthenticated direct access to login preserving the requested path', () => {
    const request = new NextRequest('http://localhost:3000/audit');

    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?redirect=%2Faudit');
  });

  it('preserves query-string context when redirecting unauthenticated access to login', () => {
    const request = new NextRequest('http://localhost:3000/audit?tab=security&filter=open');

    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/login?redirect=%2Faudit%3Ftab%3Dsecurity%26filter%3Dopen',
    );
  });

  it('uses the persisted landing cookie for authenticated auth-route redirects', () => {
    const token = createJwt({ mustChangePassword: false, role: 'admin' });
    const request = new NextRequest('http://localhost:3000/login', {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${token}; ${LANDING_PATH_COOKIE}=%2Fsessions`,
      },
    });

    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/sessions');
  });

  it('blocks authenticated direct access to protected pages outside the authorized route snapshot', () => {
    const token = createJwt({ mustChangePassword: false, role: 'admin' });
    const request = new NextRequest('http://localhost:3000/audit', {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${token}; ${LANDING_PATH_COOKIE}=%2Fsessions; ${AUTHORIZED_ROUTES_COOKIE}=%2Fdashboard%2C%2Fsecurity%2C%2Fsessions`,
      },
    });

    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/sessions');
  });

  it('allows authenticated direct access when the route is included in the authorized snapshot', () => {
    const token = createJwt({ mustChangePassword: false, role: 'admin' });
    const request = new NextRequest('http://localhost:3000/audit', {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${token}; ${LANDING_PATH_COOKIE}=%2Faudit; ${AUTHORIZED_ROUTES_COOKIE}=%2Fdashboard%2C%2Fsecurity%2C%2Faudit`,
      },
    });

    const response = middleware(request);

    expect(response.headers.get('location')).toBeNull();
  });

  it('redirects assistants away from admin-only direct access using their authorized snapshot', () => {
    const token = createJwt({ mustChangePassword: false, role: BaseRole.ASISTENTE });
    const authorizedRoutes = getAuthorizedProtectedPaths(DEFAULT_ROLE_PERMISSIONS[BaseRole.ASISTENTE]);
    const request = new NextRequest('http://localhost:3000/settings', {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${token}; ${LANDING_PATH_COOKIE}=%2Fdashboard; ${AUTHORIZED_ROUTES_COOKIE}=${encodeURIComponent(authorizedRoutes.join(','))}`,
      },
    });

    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
  });

  it('allows admins to open audit routes when the snapshot contains the protected page', () => {
    const token = createJwt({ mustChangePassword: false, role: BaseRole.ADMIN });
    const authorizedRoutes = getAuthorizedProtectedPaths(DEFAULT_ROLE_PERMISSIONS[BaseRole.ADMIN]);
    const request = new NextRequest('http://localhost:3000/audit', {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=${token}; ${LANDING_PATH_COOKIE}=%2Faudit; ${AUTHORIZED_ROUTES_COOKIE}=${encodeURIComponent(authorizedRoutes.join(','))}`,
      },
    });

    const response = middleware(request);

    expect(response.headers.get('location')).toBeNull();
  });
});
