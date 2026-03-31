import { SetMetadata } from '@nestjs/common';
import { Module as ModuleEnum, Action, Scope } from '@sistema-odontologico/permissions';

export const PERMISSION_KEY = 'permissions';

export interface PermissionMetadata {
  module: ModuleEnum;
  action: Action;
  scope?: Scope;
}

/**
 * Decorator to require a specific permission on a route.
 * The guard will evaluate VIEW, OPERATE, and SCOPE separately.
 */
export const RequirePermission = (module: ModuleEnum, action: Action, scope?: Scope) =>
  SetMetadata(PERMISSION_KEY, { module, action, scope } satisfies PermissionMetadata);

/**
 * Mark a route as public (no auth required).
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
