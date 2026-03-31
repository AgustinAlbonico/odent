/**
 * Session metadata — bound to identity + institution + effective access context.
 */
export interface SessionContext {
  /** Session ID (opaque) */
  sessionId: string;
  /** User ID */
  userId: string;
  /** User email */
  email: string;
  /** Tenant (institution) ID */
  tenantId: string;
  /** Tenant DB schema */
  schema: string;
  /** Base role slug */
  role: string;
  /** Token version for revocation */
  tokenVersion: number;
  /** Must change password flag */
  mustChangePassword: boolean;
  /** Session created at */
  createdAt: Date;
  /** Last activity at */
  lastActivityAt: Date;
  /** IP address at session creation */
  ipAddress: string;
  /** User agent at session creation */
  userAgent: string;
}

/**
 * Account states relevant to auth flow.
 */
export enum AccountState {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOCKED = 'locked',
  PENDING_PASSWORD_CHANGE = 'pending_password_change',
}

/**
 * Result of a login attempt.
 */
export interface LoginResult {
  success: boolean;
  reason?: 'invalid_credentials' | 'account_inactive' | 'account_locked' | 'pending_password_change';
  session?: SessionContext;
}

/**
 * Result of a session refresh attempt.
 */
export interface RefreshResult {
  success: boolean;
  reason?: 'token_revoked' | 'token_expired' | 'version_mismatch';
  session?: SessionContext;
}
