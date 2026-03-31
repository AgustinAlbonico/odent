/**
 * Audit event types — §14 PRD minimum catalog.
 * Every auth, session, authorization, and admin access-control event.
 */
export declare enum AuditEventType {
    LOGIN_SUCCESS = "login_success",
    LOGIN_FAILURE = "login_failure",
    LOGOUT = "logout",
    SESSION_EXPIRED = "session_expired",
    SESSION_REFRESHED = "session_refreshed",
    SESSION_CLOSED_BY_ADMIN = "session_closed_by_admin",
    PASSWORD_CHANGED = "password_changed",
    PASSWORD_FORCED_CHANGE = "password_forced_change",
    RECOVERY_REQUESTED = "recovery_requested",
    RECOVERY_COMPLETED = "recovery_completed",
    ACCOUNT_LOCKED = "account_locked",
    ACCOUNT_UNLOCKED = "account_unlocked",
    ACCOUNT_REHABILITATED = "account_rehabilitated",
    ACCESS_DENIED = "access_denied",
    PERMISSION_GRANTED = "permission_granted",
    PERMISSION_REVOKED = "permission_revoked",
    SESSION_POLICY_UPDATED = "session_policy_updated",
    AUDIT_EXPORTED = "audit_exported",
    UNUSUAL_ACCESS_DETECTED = "unusual_access_detected",
    PERMISSION_REVIEW_CONFIRMED = "permission_review_confirmed",
    PERMISSION_REVIEW_REVOKED = "permission_review_revoked",
    PERMISSION_REVIEW_EXPIRED = "permission_review_expired",
    PLAN_QUOTA_BLOCKED = "plan_quota_blocked"
}
/**
 * Full audit event record.
 */
export interface AuditEvent {
    /** Event ID */
    id: string;
    /** Event type */
    eventType: AuditEventType;
    /** Actor user ID */
    actorId: string;
    /** Actor email at event time */
    actorEmail: string;
    /** Tenant (institution) ID */
    tenantId: string;
    /** IP address */
    ipAddress: string;
    /** User agent */
    userAgent: string;
    /** Event timestamp */
    timestamp: Date;
    /** Additional event-specific metadata */
    metadata: Record<string, unknown>;
}
/**
 * Sensitive permission review states.
 */
export declare enum PermissionReviewStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    REVOKED = "revoked",
    EXPIRED = "expired"
}
/**
 * Permission review record.
 */
export interface PermissionReview {
    id: string;
    /** User whose permission is being reviewed */
    userId: string;
    /** Permission being reviewed */
    permissionId: string;
    /** Reviewer who confirmed/revoked */
    reviewerId?: string;
    /** Review period start */
    periodStart: Date;
    /** Review period end */
    periodEnd: Date;
    /** Review status */
    status: PermissionReviewStatus;
    /** When the review decision was made */
    reviewedAt?: Date;
    /** Review notes */
    notes?: string;
}
//# sourceMappingURL=events.d.ts.map