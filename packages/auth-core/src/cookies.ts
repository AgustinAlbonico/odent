/**
 * Cookie configuration for JWT session.
 * All values are secure-by-default.
 */
export interface CookieConfig {
  /** Cookie name for access token */
  accessTokenName: string;
  /** Cookie name for refresh token */
  refreshTokenName: string;
  /** HttpOnly flag — always true */
  httpOnly: boolean;
  /** Secure flag — true in production */
  secure: boolean;
  /** SameSite policy */
  sameSite: 'lax' | 'strict' | 'none';
  /** Path */
  path: string;
  /** Access token max age in seconds */
  accessMaxAge: number;
  /** Refresh token max age in seconds */
  refreshMaxAge: number;
}

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export function toCookieMaxAgeMs(maxAgeSeconds: number): number {
  return maxAgeSeconds * 1000;
}

export const defaultCookieConfig: CookieConfig = {
  accessTokenName: ACCESS_TOKEN_COOKIE,
  refreshTokenName: REFRESH_TOKEN_COOKIE,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  accessMaxAge: 15 * 60, // 15 minutes
  refreshMaxAge: 7 * 24 * 60 * 60, // 7 days
};
