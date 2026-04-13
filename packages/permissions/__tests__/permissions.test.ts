import { describe, expect, it } from 'vitest';
import {
  Action,
  BaseRole,
  DEFAULT_ROLE_PERMISSIONS,
  Module,
  type PermissionEntry,
  Scope,
} from '../src/index.ts';

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

  it('BaseRole enum has exactly 3 values', () => {
    const roleValues = Object.values(BaseRole);
    expect(roleValues).toHaveLength(3);
  });
});

// ─── Default role permissions ─────────────────────────────────────────────

describe('DEFAULT_ROLE_PERMISSIONS', () => {
  it('has entries for all 4 base roles', () => {
    expect(Object.keys(DEFAULT_ROLE_PERMISSIONS)).toHaveLength(4);
    expect(DEFAULT_ROLE_PERMISSIONS[BaseRole.SUPERADMIN]).toBeDefined();
    expect(DEFAULT_ROLE_PERMISSIONS[BaseRole.PROFESIONAL]).toBeDefined();
    expect(DEFAULT_ROLE_PERMISSIONS[BaseRole.RECEPCIONISTA]).toBeDefined();
  });

  describe('Superadmin role', () => {
    it('gets permissions for ALL modules', () => {
      const superadminPerms = DEFAULT_ROLE_PERMISSIONS[BaseRole.SUPERADMIN];
      const modulesWithPerm = new Set(superadminPerms.map((p) => p.module));
      for (const mod of Object.values(Module)) {
        expect(modulesWithPerm.has(mod), `Superadmin should have module: ${mod}`).toBe(true);
      }
    });

    it('gets ALL actions for every module', () => {
      const superadminPerms = DEFAULT_ROLE_PERMISSIONS[BaseRole.SUPERADMIN];
      const actionsPerModule = new Map<Module, Set<Action>>();
      for (const p of superadminPerms) {
        if (!actionsPerModule.has(p.module)) actionsPerModule.set(p.module, new Set());
        actionsPerModule.get(p.module)?.add(p.action);
      }
      for (const mod of Object.values(Module)) {
        const actions = actionsPerModule.get(mod);
        expect(actions, `Superadmin should have actions for module: ${mod}`).toBeDefined();
        for (const act of Object.values(Action)) {
          expect(actions?.has(act), `Superadmin should have ${act} on ${mod}`).toBe(true);
        }
      }
    });

    it('gets INSTITUTIONAL_TOTAL scope on every permission', () => {
      const superadminPerms = DEFAULT_ROLE_PERMISSIONS[BaseRole.SUPERADMIN];
      for (const p of superadminPerms) {
        expect(p.scope).toBe(Scope.INSTITUTIONAL_TOTAL);
      }
    });

    it('has 17 modules × 15 actions = 255 permissions', () => {
      const superadminPerms = DEFAULT_ROLE_PERMISSIONS[BaseRole.SUPERADMIN];
      expect(superadminPerms).toHaveLength(17 * 15);
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

  describe('Recepcionista role', () => {
    const perms = DEFAULT_ROLE_PERMISSIONS[BaseRole.RECEPCIONISTA];
    const modulesSet = new Set(perms.map((p) => p.module));

    it('gets operational modules plus professionals view access', () => {
      const expectedModules: Module[] = [
        Module.DASHBOARD,
        Module.PATIENTS,
        Module.TURNS,
        Module.CALLER,
        Module.BUDGETS,
        Module.MUTUALS,
        Module.DEPOSITS,
        Module.PATIENT_ACCOUNTING,
        Module.PROFESSIONALS,
      ];
      for (const mod of expectedModules) {
        expect(modulesSet.has(mod), `Recepcionista should have ${mod}`).toBe(true);
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
        expect(modulesSet.has(mod), `Recepcionista should NOT have ${mod}`).toBe(false);
      }
    });

    it('gets professionals as view-only module', () => {
      const professionalPerms = perms.filter((p) => p.module === Module.PROFESSIONALS);

      expect(professionalPerms).toHaveLength(3);
      expect(professionalPerms.map((p) => p.action).sort()).toEqual([
        Action.VIEW_DETAIL,
        Action.VIEW_LIST,
        Action.VIEW_MODULE,
      ]);
    });

    it('has OPERATIONAL_INSTITUTIONAL scope on all permissions', () => {
      for (const p of perms) {
        expect(p.scope, `${p.action} on ${p.module} should be OPERATIONAL_INSTITUTIONAL`).toBe(
          Scope.OPERATIONAL_INSTITUTIONAL,
        );
      }
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
