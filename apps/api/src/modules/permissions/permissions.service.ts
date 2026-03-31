import { Injectable } from '@nestjs/common';
import {
  Action,
  BaseRole,
  Module,
  Scope,
  type PermissionEntry,
  DEFAULT_ROLE_PERMISSIONS,
} from '@sistema-odontologico/permissions';
import { userPermissions } from '../../infra/database/schema.js';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../infra/database/database.service.js';

@Injectable()
export class PermissionsService {
  constructor(private readonly dbService: DatabaseService) {}

  private static readonly VIEW_ACTIONS: Action[] = [
    Action.VIEW_MODULE,
    Action.VIEW_LIST,
    Action.VIEW_DETAIL,
    Action.VIEW_SENSITIVE,
    Action.VIEW_AUDIT,
  ];

  private static readonly OPERATIVE_ACTIONS: Action[] = [
    Action.CREATE,
    Action.EDIT,
    Action.CHANGE_STATUS,
    Action.EMIT,
    Action.CANCEL,
    Action.ADMIN_CATALOG,
    Action.ADMIN_USERS,
    Action.ADMIN_ROLES_PERMISSIONS,
    Action.ADMIN_POLICIES,
    Action.CLOSE_SESSION_ADMIN,
  ];

  /**
   * Resolve effective permissions for a user.
   * Uses custom permissions if they exist, otherwise falls back to role defaults.
   */
  async resolvePermissions(userId: string, role: string): Promise<PermissionEntry[]> {
    const custom = await this.dbService.db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));

    if (custom.length > 0) {
      return custom.map((row) => ({
        module: row.module as Module,
        action: row.action as Action,
        scope: row.scope as Scope,
      }));
    }

    // Fallback to role defaults
    return DEFAULT_ROLE_PERMISSIONS[role as BaseRole] ?? [];
  }

  /**
   * Check if a user has a specific permission (VIEW dimension).
   */
  canView(permissions: PermissionEntry[], module: Module, action: Action): boolean {
    if (PermissionsService.VIEW_ACTIONS.includes(action)) {
      return permissions.some(
        (p) =>
          p.module === module &&
          p.action === action &&
          p.scope !== Scope.NONE,
      );
    }

    return permissions.some(
      (p) =>
        p.module === module &&
        PermissionsService.VIEW_ACTIONS.includes(p.action) &&
        p.scope !== Scope.NONE,
    );
  }

  /**
   * Check if a user can perform an operation (OPERATE dimension).
   */
  canOperate(permissions: PermissionEntry[], module: Module, action: Action): boolean {
    if (!PermissionsService.OPERATIVE_ACTIONS.includes(action)) return false;

    return permissions.some(
      (p) =>
        p.module === module &&
        p.action === action &&
        p.scope !== Scope.NONE,
    );
  }

  /**
   * Get effective scope for a module+action combination (SCOPE dimension).
   */
  getEffectiveScope(
    permissions: PermissionEntry[],
    module: Module,
    action: Action,
  ): Scope {
    const match = permissions.find(
      (p) => p.module === module && p.action === action,
    );
    return match?.scope ?? Scope.NONE;
  }

  /**
   * Get list of modules the user has any access to.
   * Used for sidebar/menu generation.
   */
  getAccessibleModules(permissions: PermissionEntry[]): Module[] {
    const modules = new Set<Module>();
    for (const p of permissions) {
      if (p.scope !== Scope.NONE && p.action === Action.VIEW_MODULE) {
        modules.add(p.module);
      }
    }
    return Array.from(modules);
  }
}
