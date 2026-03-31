import { Action, BaseRole, Module, Scope } from './enums';
// ─── Default permissions per role (§18.4 design) ─────
const ADMIN_PERMISSIONS = Object.values(Module).flatMap((module) => Object.values(Action).map((action) => ({
    module,
    action,
    scope: Scope.INSTITUTIONAL_TOTAL,
})));
const PROFESIONAL_MODULES = [
    Module.DASHBOARD,
    Module.PATIENTS,
    Module.TURNS,
    Module.CLINICAL_HISTORY,
    Module.ODONTOGRAM,
    Module.PRESCRIPTIONS,
    Module.BUDGETS,
];
const PROFESIONAL_VIEW_ACTIONS = [
    Action.VIEW_MODULE,
    Action.VIEW_LIST,
    Action.VIEW_DETAIL,
];
const PROFESIONAL_OPERATE_ACTIONS = [
    Action.CREATE,
    Action.EDIT,
    Action.CHANGE_STATUS,
    Action.EMIT,
];
const PROFESIONAL_PERMISSIONS = PROFESIONAL_MODULES.flatMap((module) => [...PROFESIONAL_VIEW_ACTIONS, ...PROFESIONAL_OPERATE_ACTIONS].map((action) => ({
    module,
    action,
    scope: [Action.VIEW_MODULE, Action.VIEW_LIST, Action.VIEW_DETAIL].includes(action)
        ? Scope.OWN
        : Scope.ASSIGNED,
})));
const ASISTANTE_MODULES = [
    Module.DASHBOARD,
    Module.PATIENTS,
    Module.TURNS,
    Module.CALLER,
    Module.BUDGETS,
    Module.MUTUALS,
    Module.DEPOSITS,
    Module.PATIENT_ACCOUNTING,
];
const ASISTANTE_ACTIONS = [
    Action.VIEW_MODULE,
    Action.VIEW_LIST,
    Action.VIEW_DETAIL,
    Action.CREATE,
    Action.EDIT,
    Action.CHANGE_STATUS,
];
const ASISTANTE_PERMISSIONS = ASISTANTE_MODULES.flatMap((module) => ASISTANTE_ACTIONS.map((action) => ({
    module,
    action,
    scope: Scope.OPERATIONAL_INSTITUTIONAL,
})));
const SUPERVISOR_MODULES = [
    Module.DASHBOARD,
    Module.PATIENTS,
    Module.TURNS,
    Module.CLINICAL_HISTORY,
    Module.ODONTOGRAM,
    Module.PRESCRIPTIONS,
    Module.PATIENT_ACCOUNTING,
];
const SUPERVISOR_PERMISSIONS = SUPERVISOR_MODULES.flatMap((module) => [Action.VIEW_MODULE, Action.VIEW_LIST, Action.VIEW_DETAIL, Action.VIEW_SENSITIVE].map((action) => ({
    module,
    action,
    scope: Scope.SUPERVISION,
})));
/**
 * Default permissions map per role.
 * Used as fallback when no custom permissions are set.
 */
export const DEFAULT_ROLE_PERMISSIONS = {
    [BaseRole.ADMIN]: ADMIN_PERMISSIONS,
    [BaseRole.PROFESIONAL]: PROFESIONAL_PERMISSIONS,
    [BaseRole.ASISTENTE]: ASISTANTE_PERMISSIONS,
    [BaseRole.PROFESIONAL_SUPERVISOR]: SUPERVISOR_PERMISSIONS,
};
//# sourceMappingURL=permissions.js.map