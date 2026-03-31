/**
 * Audit event types — §14 PRD minimum catalog.
 * Every auth, session, authorization, and admin access-control event.
 */
export var AuditEventType;
(function (AuditEventType) {
    // Auth lifecycle
    AuditEventType["LOGIN_SUCCESS"] = "login_success";
    AuditEventType["LOGIN_FAILURE"] = "login_failure";
    AuditEventType["LOGOUT"] = "logout";
    AuditEventType["SESSION_EXPIRED"] = "session_expired";
    AuditEventType["SESSION_REFRESHED"] = "session_refreshed";
    AuditEventType["SESSION_CLOSED_BY_ADMIN"] = "session_closed_by_admin";
    // Password
    AuditEventType["PASSWORD_CHANGED"] = "password_changed";
    AuditEventType["PASSWORD_FORCED_CHANGE"] = "password_forced_change";
    AuditEventType["RECOVERY_REQUESTED"] = "recovery_requested";
    AuditEventType["RECOVERY_COMPLETED"] = "recovery_completed";
    // Account state
    AuditEventType["ACCOUNT_LOCKED"] = "account_locked";
    AuditEventType["ACCOUNT_UNLOCKED"] = "account_unlocked";
    AuditEventType["ACCOUNT_REHABILITATED"] = "account_rehabilitated";
    // Authorization
    AuditEventType["ACCESS_DENIED"] = "access_denied";
    AuditEventType["PERMISSION_GRANTED"] = "permission_granted";
    AuditEventType["PERMISSION_REVOKED"] = "permission_revoked";
    // Session policy
    AuditEventType["SESSION_POLICY_UPDATED"] = "session_policy_updated";
    // Audit actions
    AuditEventType["AUDIT_EXPORTED"] = "audit_exported";
    // Unusual access
    AuditEventType["UNUSUAL_ACCESS_DETECTED"] = "unusual_access_detected";
    // Permission review
    AuditEventType["PERMISSION_REVIEW_CONFIRMED"] = "permission_review_confirmed";
    AuditEventType["PERMISSION_REVIEW_REVOKED"] = "permission_review_revoked";
    AuditEventType["PERMISSION_REVIEW_EXPIRED"] = "permission_review_expired";
    // Plan governance
    AuditEventType["PLAN_QUOTA_BLOCKED"] = "plan_quota_blocked";
})(AuditEventType || (AuditEventType = {}));
/**
 * Sensitive permission review states.
 */
export var PermissionReviewStatus;
(function (PermissionReviewStatus) {
    PermissionReviewStatus["PENDING"] = "pending";
    PermissionReviewStatus["CONFIRMED"] = "confirmed";
    PermissionReviewStatus["REVOKED"] = "revoked";
    PermissionReviewStatus["EXPIRED"] = "expired";
})(PermissionReviewStatus || (PermissionReviewStatus = {}));
//# sourceMappingURL=events.js.map