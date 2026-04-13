import { describe, expect, it } from 'vitest';
import { BaseRole, DEFAULT_ROLE_PERMISSIONS } from '@sistema-odontologico/permissions';
import { getSidebarNavigationItems } from './sidebar-navigation';

describe('sidebar permission visibility', () => {
  it('shows the full implemented navigation set to admin users', () => {
    const items = getSidebarNavigationItems(DEFAULT_ROLE_PERMISSIONS[BaseRole.SUPERADMIN]);

    expect(items.map((item) => item.href)).toEqual([
      '/dashboard',
      '/patients',
      '/appointments',
      '/odontogram',
      '/treatment-plans',
      '/procedures',
      '/billing',
      '/accounting',
      '/clinic',
      '/users',
      '/roles',
      '/settings',
    ]);
  });

  it('hides admin modules for profesionales while keeping clinical navigation', () => {
    const items = getSidebarNavigationItems(DEFAULT_ROLE_PERMISSIONS[BaseRole.PROFESIONAL]);
    const hrefs = items.map((item) => item.href);

    expect(hrefs).toEqual([
      '/dashboard',
      '/patients',
      '/appointments',
      '/odontogram',
      '/treatment-plans',
      '/procedures',
    ]);
    expect(hrefs).not.toContain('/settings');
    expect(hrefs).not.toContain('/users');
    expect(hrefs).not.toContain('/roles');
    expect(hrefs).not.toContain('/accounting');
  });

  it('shows operational navigation to recepcionistas and blocks clinical-admin links', () => {
    const items = getSidebarNavigationItems(DEFAULT_ROLE_PERMISSIONS[BaseRole.RECEPCIONISTA]);
    const hrefs = items.map((item) => item.href);

    expect(hrefs).toEqual(['/dashboard', '/patients', '/appointments', '/treatment-plans', '/billing']);
    expect(hrefs).not.toContain('/odontogram');
    expect(hrefs).not.toContain('/procedures');
    expect(hrefs).not.toContain('/settings');
  });
});
