export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export function toCookieMaxAgeMs(maxAgeSeconds) {
    return maxAgeSeconds * 1000;
}
export const defaultCookieConfig = {
    accessTokenName: ACCESS_TOKEN_COOKIE,
    refreshTokenName: REFRESH_TOKEN_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    accessMaxAge: 15 * 60, // 15 minutes
    refreshMaxAge: 7 * 24 * 60 * 60, // 7 days
};
//# sourceMappingURL=cookies.js.map