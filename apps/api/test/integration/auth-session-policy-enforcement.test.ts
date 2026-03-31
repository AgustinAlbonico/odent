import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { SecurityService } from '../../src/modules/security/security.service.js';
import { DEFAULT_SESSION_POLICY } from '../../src/modules/session-policy/session-policy.service.js';

function createMockDb(userOverrides: Record<string, unknown> = {}) {
  const defaultUser = {
    id: 'user-1',
    email: 'test@clinica.com',
    passwordHash: '$2a$10$validhash',
    role: 'admin',
    state: 'active',
    tokenVersion: 0,
    mustChangePassword: false,
    ...userOverrides,
  };

  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([defaultUser]),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    },
  };
}

const mockJwtService = {
  signAsync: vi.fn().mockResolvedValue('mocked-jwt-token'),
  verifyAsync: vi.fn(),
};

describe('Auth session policy enforcement — Integration', () => {
  let authService: AuthService;
  let securityService: SecurityService;
  let mockDb: ReturnType<typeof createMockDb>;
  let mockPermissionsService: { resolvePermissions: ReturnType<typeof vi.fn> };
  let mockTenantService: { resolveTenant: ReturnType<typeof vi.fn> };
  let mockSessionPolicyRuntimeService: {
    getRuntimePolicy: ReturnType<typeof vi.fn>;
    getAccessTokenExpiresInSeconds: ReturnType<typeof vi.fn>;
    enforceConcurrentSessionLimit: ReturnType<typeof vi.fn>;
    validateRefreshSession: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    securityService = new SecurityService(mockDb as any);
    mockDb = createMockDb();

    mockPermissionsService = {
      resolvePermissions: vi.fn().mockResolvedValue([]),
    };

    mockTenantService = {
      resolveTenant: vi.fn().mockResolvedValue({
        tenantId: 'tenant-1',
        schema: 'tenant_1',
        name: 'Clinica Test',
        plan: 'professional',
        maxActiveProfessionals: 10,
        activeProfessionalCount: 1,
      }),
    };

    mockSessionPolicyRuntimeService = {
      getRuntimePolicy: vi.fn().mockResolvedValue(DEFAULT_SESSION_POLICY),
      getAccessTokenExpiresInSeconds: vi.fn().mockReturnValue(15 * 60),
      enforceConcurrentSessionLimit: vi.fn().mockResolvedValue(undefined),
      validateRefreshSession: vi.fn().mockResolvedValue({
        id: 'session-1',
        createdAt: new Date('2026-03-30T08:00:00.000Z'),
      }),
    };

    authService = new AuthService(
      mockDb as never,
      mockJwtService as never,
      securityService,
      mockPermissionsService as never,
      mockTenantService as never,
      mockSessionPolicyRuntimeService as never,
    );
  });

  it('enforces max concurrent sessions before storing a new login', async () => {
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-refresh-token' as never);

    await authService.login(
      'test@clinica.com',
      'correct-password',
      '192.168.1.1',
      'Chrome/120',
      'tenant-1',
    );

    expect(mockSessionPolicyRuntimeService.enforceConcurrentSessionLimit).toHaveBeenCalledWith(
      'user-1',
      DEFAULT_SESSION_POLICY.maxConcurrentSessions,
      expect.any(Date),
      expect.objectContaining({
        userEmail: 'test@clinica.com',
      }),
    );
  });

  it('rejects refresh when runtime session validation detects max duration expiry', async () => {
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      tid: 'tenant-1',
      jti: 'session-1',
      tokenVersion: 0,
    });
    mockSessionPolicyRuntimeService.validateRefreshSession.mockResolvedValue(null);

    const result = await authService.refresh('valid-refresh-token', '192.168.1.1', 'Chrome/120');

    expect(result).toBeNull();
    expect(mockSessionPolicyRuntimeService.validateRefreshSession).toHaveBeenCalledWith(
      {
        sessionId: 'session-1',
        userId: 'user-1',
        userEmail: 'test@clinica.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome/120',
      },
      expect.any(Date),
    );
  });
});
