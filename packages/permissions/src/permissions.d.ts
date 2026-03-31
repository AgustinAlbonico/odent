import { Action, BaseRole, Module, Scope } from './enums';
/**
 * A single permission entry — module + action + scope.
 * Stored in user_permissions table.
 */
export interface PermissionEntry {
    module: Module;
    action: Action;
    scope: Scope;
}
/**
 * Effective access context resolved at login/refresh.
 * This is what gets baked into the JWT and evaluated by guards.
 */
export interface EffectiveAccess {
    role: BaseRole;
    permissions: PermissionEntry[];
}
/**
 * Default permissions map per role.
 * Used as fallback when no custom permissions are set.
 */
export declare const DEFAULT_ROLE_PERMISSIONS: Record<BaseRole, PermissionEntry[]>;
/**
 * Permission check result.
 * VIEW ≠ OPERATE ≠ SCOPE — three separate dimensions.
 */
export interface PermissionCheckResult {
    /** Can the user see this module/action at all? */
    canView: boolean;
    /** Can the user perform the operation? */
    canOperate: boolean;
    /** What is the effective scope? */
    effectiveScope: Scope;
    /** If denied, why? */
    denialReason?: 'no_view_permission' | 'no_operate_permission' | 'scope_insufficient';
}
//# sourceMappingURL=permissions.d.ts.map