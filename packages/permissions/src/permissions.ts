import { Action, BaseRole, Module, Scope } from './enums.js';

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

// ─── Default permissions per role (§18.4 design) ─────

const ADMIN_PERMISSIONS: PermissionEntry[] = Object.values(Module).flatMap((module) =>
  Object.values(Action).map((action) => ({
    module,
    action,
    scope: Scope.INSTITUTIONAL_TOTAL,
  })),
);

const PROFESIONAL_MODULES: Module[] = [
  Module.DASHBOARD,
  Module.PATIENTS,
  Module.TURNS,
  Module.CLINICAL_HISTORY,
  Module.ODONTOGRAM,
  Module.PRESCRIPTIONS,
  Module.BUDGETS,
];

const PROFESIONAL_VIEW_ACTIONS: Action[] = [
  Action.VIEW_MODULE,
  Action.VIEW_LIST,
  Action.VIEW_DETAIL,
];

const PROFESIONAL_OPERATE_ACTIONS: Action[] = [
  Action.CREATE,
  Action.EDIT,
  Action.CHANGE_STATUS,
  Action.EMIT,
];

const PROFESIONAL_PERMISSIONS: PermissionEntry[] = PROFESIONAL_MODULES.flatMap((module) =>
  [...PROFESIONAL_VIEW_ACTIONS, ...PROFESIONAL_OPERATE_ACTIONS].map((action) => ({
    module,
    action,
    scope: [Action.VIEW_MODULE, Action.VIEW_LIST, Action.VIEW_DETAIL].includes(action)
      ? Scope.OWN
      : Scope.ASSIGNED,
  })),
);

const ASISTANTE_MODULES: Module[] = [
  Module.DASHBOARD,
  Module.PATIENTS,
  Module.TURNS,
  Module.CALLER,
  Module.BUDGETS,
  Module.MUTUALS,
  Module.DEPOSITS,
  Module.PATIENT_ACCOUNTING,
];

const ASISTANTE_ACTIONS: Action[] = [
  Action.VIEW_MODULE,
  Action.VIEW_LIST,
  Action.VIEW_DETAIL,
  Action.CREATE,
  Action.EDIT,
  Action.CHANGE_STATUS,
];

const ASISTANTE_PERMISSIONS: PermissionEntry[] = ASISTANTE_MODULES.flatMap((module) =>
  ASISTANTE_ACTIONS.map((action) => ({
    module,
    action,
    scope: Scope.OPERATIONAL_INSTITUTIONAL,
  })),
);

const SUPERVISOR_MODULES: Module[] = [
  Module.DASHBOARD,
  Module.PATIENTS,
  Module.TURNS,
  Module.CLINICAL_HISTORY,
  Module.ODONTOGRAM,
  Module.PRESCRIPTIONS,
  Module.PATIENT_ACCOUNTING,
];

const SUPERVISOR_PERMISSIONS: PermissionEntry[] = SUPERVISOR_MODULES.flatMap((module) =>
  [Action.VIEW_MODULE, Action.VIEW_LIST, Action.VIEW_DETAIL, Action.VIEW_SENSITIVE].map(
    (action) => ({
      module,
      action,
      scope: Scope.SUPERVISION,
    }),
  ),
);

/**
 * Default permissions map per role.
 * Used as fallback when no custom permissions are set.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<BaseRole, PermissionEntry[]> = {
  [BaseRole.ADMIN]: ADMIN_PERMISSIONS,
  [BaseRole.PROFESIONAL]: PROFESIONAL_PERMISSIONS,
  [BaseRole.ASISTENTE]: ASISTANTE_PERMISSIONS,
  [BaseRole.PROFESIONAL_SUPERVISOR]: SUPERVISOR_PERMISSIONS,
};

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
