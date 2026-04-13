import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionsService } from '../../src/modules/permissions/permissions.service.js';
import { Action, Module, Scope, BaseRole, DEFAULT_ROLE_PERMISSIONS } from '@sistema-odontologico/permissions';
import type { PermissionEntry } from '@sistema-odontologico/permissions';

// ─── Mock DatabaseService ──────────────────────────────────────────────────

function createMockDbService(customPermissions: PermissionEntry[] = []) {
  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(
            customPermissions.map((p, i) => ({
              id: `perm-${i}`,
              userId: 'user-1',
              ...p,
            })),
          ),
        }),
      }),
    },
  };
}

describe('PermissionsService — abilities (canView, canOperate, getEffectiveScope)', () => {
  let service: PermissionsService;

  describe('with default Superadmin permissions', () => {
    beforeEach(() => {
      const mockDb = createMockDbService();
      service = new PermissionsService(mockDb as any);
    });

    it('canView returns true for permitted modules (uses resolved perms)', async () => {
      // When custom permissions are empty, resolvePermissions falls back to role defaults
      const superadminPerms = DEFAULT_ROLE_PERMISSIONS[BaseRole.SUPERADMIN];
      expect(service.canView(superadminPerms, Module.PATIENTS, Action.VIEW_LIST)).toBe(true);
      expect(service.canView(superadminPerms, Module.SYSTEM_CONFIG, Action.VIEW_MODULE)).toBe(true);
      expect(service.canView(superadminPerms, Module.AUDIT_ACCESS, Action.VIEW_AUDIT)).toBe(true);
    });

    it('canOperate returns true for operative actions', () => {
      const superadminPerms = DEFAULT_ROLE_PERMISSIONS[BaseRole.SUPERADMIN];
      expect(service.canOperate(superadminPerms, Module.PATIENTS, Action.CREATE)).toBe(true);
      expect(service.canOperate(superadminPerms, Module.USERS_ROLES_PERMISSIONS, Action.ADMIN_ROLES_PERMISSIONS)).toBe(true);
    });

    it('getEffectiveScope returns INSTITUTIONAL_TOTAL for superadmin', () => {
      const supersuperadminPerms = DEFAULT_ROLE_PERMISSIONS[BaseRole.SUPERADMIN];
      expect(service.getEffectiveScope(supersuperadminPerms, Module.PATIENTS, Action.VIEW_LIST)).toBe(
        Scope.INSTITUTIONAL_TOTAL,
      );
    });
  });

  describe('with Profesional permissions', () => {
    it('canView returns true for clinical modules', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS[BaseRole.PROFESIONAL];
      expect(service.canView(perms, Module.PATIENTS, Action.VIEW_LIST)).toBe(true);
      expect(service.canView(perms, Module.CLINICAL_HISTORY, Action.VIEW_DETAIL)).toBe(true);
    });

    it('canView returns false for admin modules', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS[BaseRole.PROFESIONAL];
      expect(service.canView(perms, Module.SYSTEM_CONFIG, Action.VIEW_MODULE)).toBe(false);
      expect(service.canView(perms, Module.AUDIT_ACCESS, Action.VIEW_AUDIT)).toBe(false);
    });

    it('canOperate returns false for view-only permissions', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS[BaseRole.PROFESIONAL];
      // VIEW_LIST is not an operative action
      expect(service.canOperate(perms, Module.PATIENTS, Action.VIEW_LIST)).toBe(false);
      expect(service.canOperate(perms, Module.PATIENTS, Action.VIEW_DETAIL)).toBe(false);
    });

    it('canOperate returns true for operative actions in allowed modules', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS[BaseRole.PROFESIONAL];
      expect(service.canOperate(perms, Module.PATIENTS, Action.CREATE)).toBe(true);
      expect(service.canOperate(perms, Module.CLINICAL_HISTORY, Action.EDIT)).toBe(true);
    });

    it('getEffectiveScope returns OWN for view actions', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS[BaseRole.PROFESIONAL];
      expect(service.getEffectiveScope(perms, Module.PATIENTS, Action.VIEW_LIST)).toBe(Scope.OWN);
    });

    it('getEffectiveScope returns ASSIGNED for operate actions', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS[BaseRole.PROFESIONAL];
      expect(service.getEffectiveScope(perms, Module.PATIENTS, Action.CREATE)).toBe(Scope.ASSIGNED);
    });
  });

  describe('with Recepcionista permissions', () => {
    it('canView returns false for clinical modules', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS[BaseRole.RECEPCIONISTA];
      expect(service.canView(perms, Module.CLINICAL_HISTORY, Action.VIEW_MODULE)).toBe(false);
      expect(service.canView(perms, Module.ODONTOGRAM, Action.VIEW_MODULE)).toBe(false);
      expect(service.canView(perms, Module.PRESCRIPTIONS, Action.VIEW_MODULE)).toBe(false);
    });

    it('canView returns true for operational modules', () => {
      const perms = DEFAULT_ROLE_PERMISSIONS[BaseRole.RECEPCIONISTA];
      expect(service.canView(perms, Module.PATIENTS, Action.VIEW_MODULE)).toBe(true);
      expect(service.canView(perms, Module.TURNS, Action.VIEW_MODULE)).toBe(true);
    });
  });

  describe('with missing permissions', () => {
    it('canView returns false for module with no permissions', () => {
      const emptyPerms: PermissionEntry[] = [];
      expect(service.canView(emptyPerms, Module.PATIENTS, Action.VIEW_LIST)).toBe(false);
    });

    it('canOperate returns false for empty permissions', () => {
      const emptyPerms: PermissionEntry[] = [];
      expect(service.canOperate(emptyPerms, Module.PATIENTS, Action.CREATE)).toBe(false);
    });

    it('getEffectiveScope returns NONE for missing permission', () => {
      const emptyPerms: PermissionEntry[] = [];
      expect(service.getEffectiveScope(emptyPerms, Module.PATIENTS, Action.VIEW_LIST)).toBe(Scope.NONE);
    });

    it('getEffectiveScope returns NONE for module not in permissions', () => {
      const perms: PermissionEntry[] = [
        { module: Module.PATIENTS, action: Action.VIEW_LIST, scope: Scope.OWN },
      ];
      expect(service.getEffectiveScope(perms, Module.SYSTEM_CONFIG, Action.VIEW_MODULE)).toBe(Scope.NONE);
    });
  });

  describe('canView rejects NONE scope', () => {
    it('returns false when permission exists but scope is NONE', () => {
      const perms: PermissionEntry[] = [
        { module: Module.PATIENTS, action: Action.VIEW_LIST, scope: Scope.NONE },
      ];
      expect(service.canView(perms, Module.PATIENTS, Action.VIEW_LIST)).toBe(false);
    });
  });

  describe('canOperate rejects NONE scope', () => {
    it('returns false when operative permission has NONE scope', () => {
      const perms: PermissionEntry[] = [
        { module: Module.PATIENTS, action: Action.CREATE, scope: Scope.NONE },
      ];
      expect(service.canOperate(perms, Module.PATIENTS, Action.CREATE)).toBe(false);
    });
  });

  describe('getAccessibleModules', () => {
    it('returns modules where user has VIEW_MODULE with non-NONE scope', () => {
      const perms: PermissionEntry[] = [
        { module: Module.PATIENTS, action: Action.VIEW_MODULE, scope: Scope.OWN },
        { module: Module.TURNS, action: Action.VIEW_MODULE, scope: Scope.OWN },
        { module: Module.SYSTEM_CONFIG, action: Action.VIEW_MODULE, scope: Scope.NONE },
        { module: Module.PATIENTS, action: Action.VIEW_LIST, scope: Scope.OWN },
      ];

      const modules = service.getAccessibleModules(perms);
      expect(modules).toContain(Module.PATIENTS);
      expect(modules).toContain(Module.TURNS);
      expect(modules).not.toContain(Module.SYSTEM_CONFIG);
    });

    it('returns empty array for no permissions', () => {
      const modules = service.getAccessibleModules([]);
      expect(modules).toHaveLength(0);
    });

    it('returns unique modules (no duplicates)', () => {
      const perms: PermissionEntry[] = [
        { module: Module.PATIENTS, action: Action.VIEW_MODULE, scope: Scope.OWN },
        { module: Module.PATIENTS, action: Action.VIEW_MODULE, scope: Scope.ASSIGNED },
      ];
      const modules = service.getAccessibleModules(perms);
      expect(modules.filter((m) => m === Module.PATIENTS)).toHaveLength(1);
    });
  });
});
