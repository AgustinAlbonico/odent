import { describe, expect, it, vi } from 'vitest';
import { AbilitiesController } from '../../src/modules/auth/abilities.controller.js';
import { AuthController } from '../../src/modules/auth/auth.controller.js';
import { Action, Module, Scope, type PermissionEntry } from '@sistema-odontologico/permissions';
import { ACCESS_TOKEN_COOKIE, defaultCookieConfig } from '@sistema-odontologico/auth-core';

describe('Auth runtime contracts', () => {
  it('returns the canonical /auth/abilities payload expected by the frontend', async () => {
    const permissions: PermissionEntry[] = [
      { module: Module.PATIENTS, action: Action.VIEW_MODULE, scope: Scope.OWN },
      { module: Module.PATIENTS, action: Action.VIEW_LIST, scope: Scope.OWN },
    ];

    const controller = new AbilitiesController({
      resolvePermissions: vi.fn().mockResolvedValue(permissions),
    } as never);

    const result = await controller.getAbilities({
      user: {
        sub: 'user-1',
        email: 'doctor@clinic.test',
        tid: 'tenant-1',
        role: 'admin',
        mustChangePassword: false,
      },
    } as never);

    expect(result).toEqual({
      user: {
        id: 'user-1',
        email: 'doctor@clinic.test',
        role: 'admin',
        tenantId: 'tenant-1',
        mustChangePassword: false,
      },
      abilities: permissions,
    });
  });

  it('keeps login continuity for forced password change by setting the auth cookie', async () => {
    const authService = {
      login: vi.fn().mockResolvedValue({
        success: false,
        reason: 'pending_password_change',
        accessToken: 'temporary-access-token',
        session: {
          userId: 'user-1',
          email: 'doctor@clinic.test',
          tenantId: 'tenant-1',
          role: 'admin',
          mustChangePassword: true,
        },
      }),
    };

    const tenantService = {
      extractTenantId: vi.fn().mockReturnValue('tenant-1'),
    };

    const controller = new AuthController(authService as never, tenantService as never);
    const response = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    };

    const result = await controller.login(
      { email: 'doctor@clinic.test', password: 'Secret123' },
      {
        ip: '127.0.0.1',
        get: vi.fn().mockReturnValue('Vitest'),
        headers: { 'x-tenant-id': 'tenant-1' },
      } as never,
      response as never,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      'temporary-access-token',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
        maxAge: defaultCookieConfig.accessMaxAge * 1000,
      }),
    );
    expect(result).toEqual({
      requiresPasswordChange: true,
      user: {
        id: 'user-1',
        email: 'doctor@clinic.test',
        role: 'admin',
        tenantId: 'tenant-1',
        mustChangePassword: true,
      },
    });
  });

  it('requires an explicit tenant header for login requests', async () => {
    const authService = {
      login: vi.fn(),
    };

    const tenantService = {
      extractTenantId: vi.fn().mockReturnValue(null),
    };

    const controller = new AuthController(authService as never, tenantService as never);

    await expect(
      controller.login(
        { email: 'doctor@clinic.test', password: 'Secret123' },
        {
          ip: '127.0.0.1',
          get: vi.fn().mockReturnValue('Vitest'),
          headers: {},
        } as never,
        {
          cookie: vi.fn(),
          clearCookie: vi.fn(),
        } as never,
      ),
    ).rejects.toThrow('Tenant header x-tenant-id is required');

    expect(authService.login).not.toHaveBeenCalled();
  });
});
