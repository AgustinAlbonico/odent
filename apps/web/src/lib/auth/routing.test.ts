import { describe, expect, it } from 'vitest';
import { Action, BaseRole, Module, Scope, type PermissionEntry } from '@sistema-odontologico/permissions';
import {
  getAuthorizedProtectedPaths,
  getVisibleNavigationItems,
  resolveContextualLandingPath,
} from './routing';

function permission(module: Module, action: Action, scope: Scope = Scope.INSTITUTIONAL_TOTAL): PermissionEntry {
  return { module, action, scope };
}

describe('auth routing policy', () => {
  it('filters sidebar navigation to modules with view permission', () => {
    const items = [
      { label: 'Dashboard', href: '/dashboard', module: Module.DASHBOARD },
      { label: 'Sesiones', href: '/sessions', module: Module.SYSTEM_CONFIG },
      { label: 'Auditoría', href: '/audit', module: Module.AUDIT_ACCESS },
    ];

    const abilities = [
      permission(Module.DASHBOARD, Action.VIEW_MODULE),
      permission(Module.AUDIT_ACCESS, Action.VIEW_MODULE),
      permission(Module.SYSTEM_CONFIG, Action.ADMIN_POLICIES),
    ];

    expect(getVisibleNavigationItems(items, abilities)).toEqual([
      { label: 'Dashboard', href: '/dashboard', module: Module.DASHBOARD },
      { label: 'Auditoría', href: '/audit', module: Module.AUDIT_ACCESS },
    ]);
  });

  it('chooses the first contextual landing allowed by effective permissions', () => {
    const abilities = [
      permission(Module.AUDIT_ACCESS, Action.VIEW_AUDIT),
      permission(Module.SYSTEM_CONFIG, Action.CLOSE_SESSION_ADMIN),
    ];

    expect(resolveContextualLandingPath(BaseRole.ADMIN, abilities)).toBe('/sessions');
  });

  it('falls back to security when no landing-specific permission is available', () => {
    expect(resolveContextualLandingPath(BaseRole.PROFESIONAL, [])).toBe('/security');
  });

  it('serializes implemented protected routes that the session can actually open', () => {
    const abilities = [
      permission(Module.DASHBOARD, Action.VIEW_MODULE),
      permission(Module.SYSTEM_CONFIG, Action.ADMIN_POLICIES),
      permission(Module.AUDIT_ACCESS, Action.VIEW_AUDIT),
    ];

    expect(getAuthorizedProtectedPaths(abilities)).toEqual(['/dashboard', '/security', '/settings', '/audit']);
  });
});
