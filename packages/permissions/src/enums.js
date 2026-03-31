/**
 * 17 system modules (§18.1 design / §12.2 PRD).
 */
export var Module;
(function (Module) {
    Module["DASHBOARD"] = "dashboard";
    Module["PATIENTS"] = "patients";
    Module["TURNS"] = "turns";
    Module["CALLER"] = "caller";
    Module["CLINICAL_HISTORY"] = "clinical_history";
    Module["ODONTOGRAM"] = "odontogram";
    Module["PRESCRIPTIONS"] = "prescriptions";
    Module["BUDGETS"] = "budgets";
    Module["MUTUALS"] = "mutuals";
    Module["DEPOSITS"] = "deposits";
    Module["PATIENT_ACCOUNTING"] = "patient_accounting";
    Module["GENERAL_ACCOUNTING"] = "general_accounting";
    Module["PROFESSIONALS"] = "professionals";
    Module["ASSISTANTS"] = "assistants";
    Module["SYSTEM_CONFIG"] = "system_config";
    Module["USERS_ROLES_PERMISSIONS"] = "users_roles_permissions";
    Module["AUDIT_ACCESS"] = "audit_access";
})(Module || (Module = {}));
/**
 * 15 action types — taxonomy from §18.2 / §11 PRD.
 * Separated into visualization, operational, administrative, and special.
 */
export var Action;
(function (Action) {
    // Visualization (5)
    Action["VIEW_MODULE"] = "view_module";
    Action["VIEW_LIST"] = "view_list";
    Action["VIEW_DETAIL"] = "view_detail";
    Action["VIEW_SENSITIVE"] = "view_sensitive";
    Action["VIEW_AUDIT"] = "view_audit";
    // Operational (5)
    Action["CREATE"] = "create";
    Action["EDIT"] = "edit";
    Action["CHANGE_STATUS"] = "change_status";
    Action["EMIT"] = "emit";
    Action["CANCEL"] = "cancel";
    // Administrative (4)
    Action["ADMIN_CATALOG"] = "admin_catalog";
    Action["ADMIN_USERS"] = "admin_users";
    Action["ADMIN_ROLES_PERMISSIONS"] = "admin_roles_permissions";
    Action["ADMIN_POLICIES"] = "admin_policies";
    // Special (1)
    Action["CLOSE_SESSION_ADMIN"] = "close_session_admin";
})(Action || (Action = {}));
/**
 * 6 scope levels — the ALCANCE dimension.
 * VIEW ≠ OPERATE ≠ SCOPE is the core rule.
 */
export var Scope;
(function (Scope) {
    /** No access at all */
    Scope["NONE"] = "none";
    /** Only own records */
    Scope["OWN"] = "own";
    /** Records assigned to the user */
    Scope["ASSIGNED"] = "assigned";
    /** Operational scope — assistants see all patients but limited actions */
    Scope["OPERATIONAL_INSTITUTIONAL"] = "operational_institutional";
    /** Can view subordinates' work */
    Scope["SUPERVISION"] = "supervision";
    /** Full institutional access */
    Scope["INSTITUTIONAL_TOTAL"] = "institutional_total";
})(Scope || (Scope = {}));
/**
 * Base roles — §18.4 design / §4 PRD.
 */
export var BaseRole;
(function (BaseRole) {
    BaseRole["ADMIN"] = "admin";
    BaseRole["PROFESIONAL"] = "profesional";
    BaseRole["ASISTENTE"] = "asistente";
    BaseRole["PROFESIONAL_SUPERVISOR"] = "profesional_supervisor";
})(BaseRole || (BaseRole = {}));
//# sourceMappingURL=enums.js.map