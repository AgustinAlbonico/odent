/**
 * JWT payload structure.
 * Bound to identity + institution + effective access context.
 */
export interface JwtPayload {
    /** User ID */
    sub: string;
    /** User email */
    email: string;
    /** Tenant (institution) ID */
    tid: string;
    /** Tenant DB schema name */
    schema: string;
    /** Base role slug */
    role: string;
    /** Incremented on forced reset / admin logout */
    tokenVersion: number;
    /** Whether user must change password before normal operation */
    mustChangePassword: boolean;
    /** Backing session ID for runtime policy enforcement */
    sid: string;
    /** ISO timestamp */
    iat: number;
    /** Expiration timestamp */
    exp: number;
}
export interface RefreshTokenPayload {
    sub: string;
    tid: string;
    /** Random opaque ID — stored in DB for revocation */
    jti: string;
    tokenVersion: number;
    iat: number;
    exp: number;
}
//# sourceMappingURL=jwt.d.ts.map