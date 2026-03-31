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
export declare const ACCESS_TOKEN_COOKIE = "access_token";
export declare const REFRESH_TOKEN_COOKIE = "refresh_token";
export declare function toCookieMaxAgeMs(maxAgeSeconds: number): number;
export declare const defaultCookieConfig: CookieConfig;
//# sourceMappingURL=cookies.d.ts.map