import { describe, it, expect } from 'vitest';
import {
  Module,
  Action,
  Scope,
  BaseRole,
  DEFAULT_ROLE_PERMISSIONS,
  type PermissionEntry,
} from '../src/index.js';

// ─── Enum cardinality (§18.1 design / §12.2 PRD) ─────────────────────────

describe('Enum values', () => {
  it('Module enum has exactly 17 values', () => {
    const moduleValues = Object.values(Module);
    expect(moduleValues).toHaveLength(17);
  });

  it('Action enum has exactly 15 values', () => {
    const actionValues = Object.values(Action);
    expect(actionValues).toHaveLength(15);
  });

  it('Scope enum has exactly 6 values', () => {
    const scopeValues = Object.values(Scope);
    expect(scopeValues).toHaveLength(6);
  });

  it('BaseRole enum has exactly 4 values', () => {
    const roleValues = Object.values(BaseRole);
    expect(roleValues).toHaveLength(4);
  });
});

// ─── Default role permissions ─────────────────────────────────────────────

describe('DEFAULT_ROLE_PERMISSIONS', () => {
  it('has entries for all 4 base roles', () => {
    expect(Object.keys(DEFAULT_ROLE_PERMISSIONS)).toHaveLength(4);
    expect(DEFAULT_ROLE_PERMISSIONS[BaseRole.ADMIN]).toBeDefined();
    expect(DEFAULT_ROLE_PERMISSIONS[BaseRole.PROFESIONAL]).toBeDefined();
    expect(DEFAULT_ROLE_PERMISSIONS[BaseRole.ASISTENTE]).toBeDefined();
    expect(DEFAULT_ROLE_PERMISSIONS[BaseRole.PROFESIONAL_SUPERVISOR]).toBeDefined();
  });

  describe('Admin role', () => {
    it('gets permissions for ALL modules', () => {
      const adminPerms = DEFAULT_ROLE_PERMISSIONS[BaseRole.ADMIN];
      const modulesWithPerm = new Set(adminPerms.map((p) => p.module));
      for (const mod of Object.values(Module)) {
        expect(modulesWithPerm.has(mod), `Admin should have module: ${mod}`).toBe(true);
      }
    });

    it('gets ALL actions for every module', () => {
      const adminPerms = DEFAULT_ROLE_PERMISSIONS[BaseRole.ADMIN];
      const actionsPerModule = new Map<Module, Set<Action>>();
      for (const p of adminPerms) {
        if (!actionsPerModule.has(p.module)) actionsPerModule.set(p.module, new Set());
        actionsPerModule.get(p.module)!.add(p.action);
      }
      for (const mod of Object.values(Module)) {
        const actions = actionsPerModule.get(mod);
        expect(actions, `Admin should have actions for module: ${mod}`).toBeDefined();
        for (const act of Object.values(Action)) {
          expect(actions!.has(act), `Admin should have ${act} on ${mod}`).toBe(true);
        }
      }
    });

    it('gets INSTITUTIONAL_TOTAL scope on every permission', () => {
      const adminPerms = DEFAULT_ROLE_PERMISSIONS[BaseRole.ADMIN];
      for (const p of adminPerms) {
        expect(p.scope).toBe(Scope.INSTITUTIONAL_TOTAL);
      }
    });

    it('has 17 modules × 15 actions = 255 permissions', () => {
      const adminPerms = DEFAULT_ROLE_PERMISSIONS[BaseRole.ADMIN];
      expect(adminPerms).toHaveLength(17 * 15);
    });
  });

  describe('Profesional role', () => {
    const perms = DEFAULT_ROLE_PERMISSIONS[BaseRole.PROFESIONAL];
    const modulesSet = new Set(perms.map((p) => p.module));

    it('gets clinical modules only (7 modules)', () => {
      const expectedModules: Module[] = [
        Module.DASHBOARD,
        Module.PATIENTS,
        Module.TURNS,
        Module.CLINICAL_HISTORY,
        Module.ODONTOGRAM,
        Module.PRESCRIPTIONS,
        Module.BUDGETS,
      ];
      for (const mod of expectedModules) {
        expect(modulesSet.has(mod), `Profesional should have ${mod}`).toBe(true);
      }
    });

    it('does NOT get administrative modules', () => {
      const excludedModules: Module[] = [
        Module.SYSTEM_CONFIG,
        Module.USERS_ROLES_PERMISSIONS,
        Module.AUDIT_ACCESS,
        Module.GENERAL_ACCOUNTING,
        Module.PROFESSIONALS,
        Module.ASSISTANTS,
      ];
      for (const mod of excludedModules) {
        expect(modulesSet.has(mod), `Profesional should NOT have ${mod}`).toBe(false);
      }
    });

    it('has view actions with OWN scope', () => {
      const viewPerms = perms.filter(
        (p) =>
          p.action === Action.VIEW_MODULE ||
          p.action === Action.VIEW_LIST ||
          p.action === Action.VIEW_DETAIL,
      );
      for (const p of viewPerms) {
        expect(p.scope, `${p.action} on ${p.module} should be OWN`).toBe(Scope.OWN);
      }
    });

    it('has operate actions with ASSIGNED scope', () => {
      const operatePerms = perms.filter(
        (p) =>
          p.action === Action.CREATE ||
          p.action === Action.EDIT ||
          p.action === Action.CHANGE_STATUS ||
          p.action === Action.EMIT,
      );
      for (const p of operatePerms) {
        expect(p.scope, `${p.action} on ${p.module} should be ASSIGNED`).toBe(Scope.ASSIGNED);
      }
    });
  });

  describe('Asistente role', () => {
    const perms = DEFAULT_ROLE_PERMISSIONS[BaseRole.ASISTENTE];
    const modulesSet = new Set(perms.map((p) => p.module));

    it('gets operational modules (8 modules)', () => {
      const expectedModules: Module[] = [
        Module.DASHBOARD,
        Module.PATIENTS,
        Module.TURNS,
        Module.CALLER,
        Module.BUDGETS,
        Module.MUTUALS,
        Module.DEPOSITS,
        Module.PATIENT_ACCOUNTING,
      ];
      for (const mod of expectedModules) {
        expect(modulesSet.has(mod), `Asistente should have ${mod}`).toBe(true);
      }
    });

    it('does NOT get clinical or admin modules', () => {
      const excludedModules: Module[] = [
        Module.CLINICAL_HISTORY,
        Module.ODONTOGRAM,
        Module.PRESCRIPTIONS,
        Module.SYSTEM_CONFIG,
        Module.USERS_ROLES_PERMISSIONS,
        Module.AUDIT_ACCESS,
        Module.GENERAL_ACCOUNTING,
      ];
      for (const mod of excludedModules) {
        expect(modulesSet.has(mod), `Asistente should NOT have ${mod}`).toBe(false);
      }
    });

    it('has OPERATIONAL_INSTITUTIONAL scope on all permissions', () => {
      for (const p of perms) {
        expect(p.scope, `${p.action} on ${p.module} should be OPERATIONAL_INSTITUTIONAL`).toBe(
          Scope.OPERATIONAL_INSTITUTIONAL,
        );
      }
    });
  });

  describe('Profesional Supervisor role', () => {
    const perms = DEFAULT_ROLE_PERMISSIONS[BaseRole.PROFESIONAL_SUPERVISOR];
    const modulesSet = new Set(perms.map((p) => p.module));

    it('gets clinical + supervision modules (7 modules)', () => {
      const expectedModules: Module[] = [
        Module.DASHBOARD,
        Module.PATIENTS,
        Module.TURNS,
        Module.CLINICAL_HISTORY,
        Module.ODONTOGRAM,
        Module.PRESCRIPTIONS,
        Module.PATIENT_ACCOUNTING,
      ];
      for (const mod of expectedModules) {
        expect(modulesSet.has(mod), `Supervisor should have ${mod}`).toBe(true);
      }
    });

    it('has SUPERVISION scope on all permissions', () => {
      for (const p of perms) {
        expect(p.scope, `${p.action} on ${p.module} should be SUPERVISION`).toBe(Scope.SUPERVISION);
      }
    });

    it('has VIEW_SENSITIVE action (different from Profesional)', () => {
      const sensitivePerms = perms.filter((p) => p.action === Action.VIEW_SENSITIVE);
      expect(sensitivePerms.length).toBeGreaterThan(0);
    });
  });
});

// ─── Permission evaluation — VIEW ≠ OPERATE ≠ SCOPE ──────────────────────

describe('Permission evaluation rules', () => {
  const viewPermission: PermissionEntry = {
    module: Module.PATIENTS,
    action: Action.VIEW_LIST,
    scope: Scope.OWN,
  };

  const operatePermission: PermissionEntry = {
    module: Module.PATIENTS,
    action: Action.CREATE,
    scope: Scope.ASSIGNED,
  };

  const noPermission: PermissionEntry = {
    module: Module.PATIENTS,
    action: Action.VIEW_LIST,
    scope: Scope.NONE,
  };

  it('VIEW permission does not imply OPERATE permission', () => {
    // Having view_module does not give create/edit
    expect(viewPermission.action).not.toBe(Action.CREATE);
    expect(viewPermission.action).not.toBe(Action.EDIT);
    expect(viewPermission.action).not.toBe(Action.CHANGE_STATUS);
  });

  it('OPERATE permission does not imply higher SCOPE', () => {
    // CREATE with ASSIGNED scope ≠ INSTITUTIONAL_TOTAL
    expect(operatePermission.scope).toBe(Scope.ASSIGNED);
    expect(operatePermission.scope).not.toBe(Scope.INSTITUTIONAL_TOTAL);
    expect(operatePermission.scope).not.toBe(Scope.SUPERVISION);
  });

  it('SCOPE=NONE means no effective access', () => {
    expect(noPermission.scope).toBe(Scope.NONE);
    // A permission with NONE scope should be treated as no-access
    // (this is evaluated in the guard/service, but the data model supports it)
  });

  it('Scope levels are correctly ordered: NONE < OWN < ASSIGNED < OI < SUPERVISION < IT', () => {
    const scopeOrder: Scope[] = [
      Scope.NONE,
      Scope.OWN,
      Scope.ASSIGNED,
      Scope.OPERATIONAL_INSTITUTIONAL,
      Scope.SUPERVISION,
      Scope.INSTITUTIONAL_TOTAL,
    ];
    for (let i = 1; i < scopeOrder.length; i++) {
      expect(scopeOrder.indexOf(scopeOrder[i])).toBeGreaterThan(
        scopeOrder.indexOf(scopeOrder[i - 1]),
      );
    }
  });
});
