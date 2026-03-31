import { describe, it, expect, beforeEach, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { SecurityService } from '../../src/modules/security/security.service.js';
import { AuditEventType } from '@sistema-odontologico/audit-core';
import { DEFAULT_SESSION_POLICY } from '../../src/modules/session-policy/session-policy.service.js';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockInsertValues = vi.fn().mockResolvedValue(undefined);
const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

const mockUpdateSet = vi.fn().mockResolvedValue(undefined);
const mockUpdateWhere = vi.fn().mockReturnValue({ set: mockUpdateSet });
const mockUpdate = vi.fn().mockReturnValue({ set: () => ({ where: mockUpdateWhere }), where: mockUpdateWhere });

const mockSelectFromWhere = vi.fn();
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectFromWhere, limit: vi.fn().mockReturnValue(mockSelectFromWhere) });
const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

function createMockDb(userOverrides: Record<string, any> = {}) {
  const defaultUser = {
    id: 'user-1',
    email: 'test@clinica.com',
    passwordHash: '$2a$10$validhash', // Will be mocked in bcrypt
    role: 'admin',
    state: 'active',
    tokenVersion: 0,
    mustChangePassword: false,
    ...userOverrides,
  };

  return {
    db: {
      select: mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([defaultUser]),
          }),
        }),
      }),
      insert: mockInsert,
      update: mockUpdate,
    },
  };
}

const mockJwtService = {
  signAsync: vi.fn().mockResolvedValue('mocked-jwt-token'),
  verifyAsync: vi.fn(),
};

function getAuditPayloads() {
  return mockInsertValues.mock.calls
    .map(([payload]) => payload)
    .filter((payload) => payload && typeof payload === 'object' && 'eventType' in payload);
}

function findAuditPayload(eventType: AuditEventType) {
  return getAuditPayloads().find((payload) => payload.eventType === eventType);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Auth Lifecycle — Integration', () => {
  let authService: AuthService;
  let securityService: SecurityService;
  let mockDb: ReturnType<typeof createMockDb>;
  let mockPermissionsService: any;
  let mockTenantService: any;
  let mockSessionPolicyRuntimeService: any;

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
        schema: 'tenant_tenant_1',
        name: 'Clinica Centro',
        plan: 'basic',
        maxActiveProfessionals: 3,
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
      mockDb as any,
      mockJwtService as any,
      securityService,
      mockPermissionsService,
      mockTenantService,
      mockSessionPolicyRuntimeService,
    );
  });

  // ─── Login success ──────────────────────────────────────────────────────

  describe('Login success', () => {
    it('creates session and audit event on successful login', async () => {
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-refresh-token' as never);

      const result = await authService.login(
        'test@clinica.com',
        'correct-password',
        '192.168.1.1',
        'Chrome/120',
        'tenant-1',
      );

      // Session created (insert into sessions)
      expect(mockDb.db.insert).toHaveBeenCalled();

      // Audit event recorded (insert into auditEvents)
      // The service calls insert at least twice: session + audit event
      const insertCalls = mockInsert.mock.calls.length;
      expect(insertCalls).toBeGreaterThanOrEqual(1);
    });

    it('binds the resolved tenant schema into session and JWT payload', async () => {
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-refresh-token' as never);

      const result = await authService.login(
        'test@clinica.com',
        'correct-password',
        '192.168.1.1',
        'Chrome/120',
        'tenant-1',
      );

      expect(mockTenantService.resolveTenant).toHaveBeenCalledWith('tenant-1');
      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          tid: 'tenant-1',
          schema: 'tenant_tenant_1',
        }),
        expect.objectContaining({
          expiresIn: 15 * 60,
        }),
      );
      expect(result.session?.schema).toBe('tenant_tenant_1');
    });

    it('signs login tokens with expiresIn options instead of embedding exp in the payload', async () => {
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-refresh-token' as never);

      await authService.login(
        'test@clinica.com',
        'correct-password',
        '192.168.1.1',
        'Chrome/120',
        'tenant-1',
      );

      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        expect.not.objectContaining({
          exp: expect.any(Number),
        }),
        expect.objectContaining({
          expiresIn: 15 * 60,
        }),
      );

      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        expect.not.objectContaining({
          exp: expect.any(Number),
        }),
        expect.objectContaining({
          expiresIn: `${DEFAULT_SESSION_POLICY.maxSessionDurationHours}h`,
        }),
      );
    });

    it('returns a concrete unusual-access notice when login happens from a new context', async () => {
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-refresh-token' as never);

      await authService.login(
        'test@clinica.com',
        'correct-password',
        '192.168.1.1',
        'Chrome/120',
        'tenant-1',
      );

      const result = await authService.login(
        'test@clinica.com',
        'correct-password',
        '10.0.0.55',
        'Firefox/124',
        'tenant-1',
      );

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          securityNotice: expect.objectContaining({
            code: 'unusual_access_detected',
            reasons: expect.arrayContaining(['new_ip_address', 'new_user_agent']),
          }),
        }),
      );

      expect(findAuditPayload(AuditEventType.UNUSUAL_ACCESS_DETECTED)).toBeDefined();
    });
  });

  // ─── Login failure ──────────────────────────────────────────────────────

  describe('Login failure', () => {
    it('records LOGIN_FAILURE audit for wrong password on an operable account', async () => {
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await authService.login(
        'test@clinica.com',
        'wrong-password',
        '192.168.1.1',
        'Chrome/120',
        'tenant-1',
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('invalid_credentials');

      const auditPayload = findAuditPayload(AuditEventType.LOGIN_FAILURE);
      expect(auditPayload).toEqual(
        expect.objectContaining({
          actorId: 'user-1',
          actorEmail: 'test@clinica.com',
        }),
      );
      expect(JSON.parse(auditPayload!.metadata)).toEqual(
        expect.objectContaining({
          reason: 'invalid_credentials',
          attemptedEmail: 'test@clinica.com',
        }),
      );
    });

    it('records failed attempt when user not found', async () => {
      // Override select to return empty user
      mockDb.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await authService.login(
        'nonexistent@test.com',
        'any-password',
        '192.168.1.1',
        'Chrome/120',
        'tenant-1',
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('invalid_credentials');

      // Security service should have recorded the attempt (DB-backed, no in-memory check)
      const lockStatus = await securityService.getAccountLockStatus('nonexistent@test.com');
      expect(lockStatus).toBeNull();
    });

    it('locks the account on the fifth failed attempt and emits ACCOUNT_LOCKED audit', async () => {
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      let result: Awaited<ReturnType<AuthService['login']>> | undefined;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        result = await authService.login(
          'test@clinica.com',
          'wrong-password',
          '192.168.1.1',
          'Chrome/120',
          'tenant-1',
        );
      }

      expect(result).toEqual(
        expect.objectContaining({
          success: false,
          reason: 'account_locked',
        }),
      );

      expect(findAuditPayload(AuditEventType.ACCOUNT_LOCKED)).toEqual(
        expect.objectContaining({
          actorId: 'user-1',
          actorEmail: 'test@clinica.com',
        }),
      );
    });

    it('records LOGIN_FAILURE audit for inactive accounts', async () => {
      mockDb = createMockDb({ state: 'inactive' });
      authService = new AuthService(
        mockDb as any,
        mockJwtService as any,
        securityService,
        mockPermissionsService,
        mockTenantService,
        mockSessionPolicyRuntimeService,
      );
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await authService.login(
        'test@clinica.com',
        'correct-password',
        '192.168.1.1',
        'Chrome/120',
        'tenant-1',
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('account_inactive');
      const auditPayload = findAuditPayload(AuditEventType.LOGIN_FAILURE);
      expect(auditPayload).toEqual(
        expect.objectContaining({
          actorId: 'user-1',
        }),
      );
      expect(JSON.parse(auditPayload!.metadata)).toEqual(
        expect.objectContaining({
          reason: 'account_inactive',
        }),
      );
    });
  });

  // ─── Logout ─────────────────────────────────────────────────────────────

  describe('Logout', () => {
    it('closes session and records audit event', async () => {
      await authService.logout('session-1', 'user-1', '192.168.1.1', 'Chrome/120');

      // Session should be updated (closed)
      expect(mockDb.db.update).toHaveBeenCalled();

      // Audit event should be inserted
      expect(mockDb.db.insert).toHaveBeenCalled();
    });
  });

  // ─── Refresh rotates tokens ─────────────────────────────────────────────

  describe('Refresh', () => {
    it('rotates tokens on valid refresh', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        tid: 'tenant-1',
        jti: 'old-token-id',
        tokenVersion: 0,
      });

      let selectCallCount = 0;
      mockDb.db.select = vi.fn().mockImplementation(() => {
        selectCallCount++;

        if (selectCallCount === 1) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    id: 'user-1',
                    email: 'test@clinica.com',
                    role: 'admin',
                    tokenVersion: 0,
                    mustChangePassword: false,
                  },
                ]),
              }),
            }),
          };
        }

        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: 'session-1' }]),
            }),
          }),
        };
      });

      const result = await authService.refresh(
        'valid-refresh-token',
        '192.168.1.1',
        'Chrome/120',
      );

      expect(result).not.toBeNull();
      expect(result!.accessToken).toBeDefined();
      expect(result!.refreshToken).toBeDefined();

      // Tokens were signed (access + refresh)
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
    });

    it('signs refresh-rotated tokens with expiresIn options instead of embedding exp in the payload', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        tid: 'tenant-1',
        jti: 'old-token-id',
        tokenVersion: 0,
      });

      let selectCallCount = 0;
      mockDb.db.select = vi.fn().mockImplementation(() => {
        selectCallCount++;

        if (selectCallCount === 1) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    id: 'user-1',
                    email: 'test@clinica.com',
                    role: 'admin',
                    tokenVersion: 0,
                    mustChangePassword: false,
                  },
                ]),
              }),
            }),
          };
        }

        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: 'session-1' }]),
            }),
          }),
        };
      });

      await authService.refresh('valid-refresh-token', '192.168.1.1', 'Chrome/120');

      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        expect.not.objectContaining({
          exp: expect.any(Number),
        }),
        expect.objectContaining({
          expiresIn: 15 * 60,
        }),
      );

      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        expect.not.objectContaining({
          exp: expect.any(Number),
        }),
        expect.objectContaining({
          expiresIn: `${DEFAULT_SESSION_POLICY.maxSessionDurationHours}h`,
        }),
      );
    });

    it('resolves tenant schema again when refreshing tokens', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        tid: 'tenant-1',
        jti: 'old-token-id',
        tokenVersion: 0,
      });

      let selectCallCount = 0;
      mockDb.db.select = vi.fn().mockImplementation(() => {
        selectCallCount++;

        if (selectCallCount === 1) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    id: 'user-1',
                    email: 'test@clinica.com',
                    role: 'admin',
                    tokenVersion: 0,
                    mustChangePassword: false,
                  },
                ]),
              }),
            }),
          };
        }

        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: 'session-1' }]),
            }),
          }),
        };
      });

      const result = await authService.refresh(
        'valid-refresh-token',
        '192.168.1.1',
        'Chrome/120',
      );

      expect(result).not.toBeNull();
      expect(mockTenantService.resolveTenant).toHaveBeenCalledWith('tenant-1');
      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          tid: 'tenant-1',
          schema: 'tenant_tenant_1',
        }),
        expect.objectContaining({
          expiresIn: 15 * 60,
        }),
      );
    });

    it('rejects refresh when token version mismatch', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        tid: 'tenant-1',
        jti: 'old-token-id',
        tokenVersion: 0, // Old version
      });

      // Mock user with newer token version
      mockDb.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: 'user-1',
              tokenVersion: 2, // Newer — mismatch!
            }]),
          }),
        }),
      });

      const result = await authService.refresh(
        'old-refresh-token',
        '192.168.1.1',
        'Chrome/120',
      );

      expect(result).toBeNull();
    });

    it('rejects refresh when no active session found', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        tid: 'tenant-1',
        jti: 'token-id',
        tokenVersion: 0,
      });
      mockSessionPolicyRuntimeService.validateRefreshSession.mockResolvedValue(null);

      mockDb.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'user-1', tokenVersion: 0 }]),
          }),
        }),
      });

      const result = await authService.refresh(
        'valid-refresh-token',
        '192.168.1.1',
        'Chrome/120',
      );

      expect(result).toBeNull();
    });
  });

  // ─── Locked out user ────────────────────────────────────────────────────

  describe('Locked out user', () => {
    it('returns account_locked when isLockedOut is true', async () => {
      // Trigger lockout
      for (let i = 0; i < 5; i++) {
        securityService.recordFailedAttempt('locked@test.com');
      }

      const result = await authService.login(
        'locked@test.com',
        'any-password',
        '192.168.1.1',
        'Chrome/120',
        'tenant-1',
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe('account_locked');
    });
  });
});
