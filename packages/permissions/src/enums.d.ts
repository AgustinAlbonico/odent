/**
 * 17 system modules (§18.1 design / §12.2 PRD).
 */
export declare enum Module {
    DASHBOARD = "dashboard",
    PATIENTS = "patients",
    TURNS = "turns",
    CALLER = "caller",
    CLINICAL_HISTORY = "clinical_history",
    ODONTOGRAM = "odontogram",
    PRESCRIPTIONS = "prescriptions",
    BUDGETS = "budgets",
    MUTUALS = "mutuals",
    DEPOSITS = "deposits",
    PATIENT_ACCOUNTING = "patient_accounting",
    GENERAL_ACCOUNTING = "general_accounting",
    PROFESSIONALS = "professionals",
    ASSISTANTS = "assistants",
    SYSTEM_CONFIG = "system_config",
    USERS_ROLES_PERMISSIONS = "users_roles_permissions",
    AUDIT_ACCESS = "audit_access"
}
/**
 * 15 action types — taxonomy from §18.2 / §11 PRD.
 * Separated into visualization, operational, administrative, and special.
 */
export declare enum Action {
    VIEW_MODULE = "view_module",
    VIEW_LIST = "view_list",
    VIEW_DETAIL = "view_detail",
    VIEW_SENSITIVE = "view_sensitive",
    VIEW_AUDIT = "view_audit",
    CREATE = "create",
    EDIT = "edit",
    CHANGE_STATUS = "change_status",
    EMIT = "emit",
    CANCEL = "cancel",
    ADMIN_CATALOG = "admin_catalog",
    ADMIN_USERS = "admin_users",
    ADMIN_ROLES_PERMISSIONS = "admin_roles_permissions",
    ADMIN_POLICIES = "admin_policies",
    CLOSE_SESSION_ADMIN = "close_session_admin"
}
/**
 * 6 scope levels — the ALCANCE dimension.
 * VIEW ≠ OPERATE ≠ SCOPE is the core rule.
 */
export declare enum Scope {
    /** No access at all */
    NONE = "none",
    /** Only own records */
    OWN = "own",
    /** Records assigned to the user */
    ASSIGNED = "assigned",
    /** Operational scope — assistants see all patients but limited actions */
    OPERATIONAL_INSTITUTIONAL = "operational_institutional",
    /** Can view subordinates' work */
    SUPERVISION = "supervision",
    /** Full institutional access */
    INSTITUTIONAL_TOTAL = "institutional_total"
}
/**
 * Base roles — §18.4 design / §4 PRD.
 */
export declare enum BaseRole {
    SUPERADMIN = "superadmin",
    PROFESIONAL = "profesional",
    RECEPCIONISTA = "recepcionista"
}
//# sourceMappingURL=enums.d.ts.map