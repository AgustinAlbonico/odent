import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PasswordService } from '../../src/modules/auth/password/password.service.js';
import { AuditEventType } from '@sistema-odontologico/audit-core';
import { passwordRecoveryTokens, sessions, users as usersTable } from '../../src/infra/database/schema.js';

// ─── Mock infrastructure ──────────────────────────────────────────────────

const asSelectResult = <T>(rows: T[]) => ({
  limit: vi.fn().mockResolvedValue(rows),
  then: (resolve: (value: T[]) => unknown) => Promise.resolve(resolve(rows)),
});

/**
 * Creates a mock DatabaseService that simulates the recovery flow.
 * Uses a simple in-memory store for tokens.
 */
function createRecoveryMockDb() {
  const tokens: Map<string, { id: string; userId: string; tokenHash: string; expiresAt: Date; usedAt: Date | null }> = new Map();
  const users = new Map<string, { id: string; email: string; passwordHash: string; tokenVersion: number; mustChangePassword: boolean; state: string }>();
  const auditLog: any[] = [];

  users.set('user-1', {
    id: 'user-1',
    email: 'recover@test.com',
    passwordHash: 'old-hash',
    tokenVersion: 0,
    mustChangePassword: false,
    state: 'active',
  });

  const mockInsert = vi.fn().mockReturnValue({
    values: vi.fn().mockImplementation((data: any) => {
      if (data.userId && data.tokenHash) {
        // Recovery token insert
        tokens.set(data.tokenHash, {
          id: `token-${tokens.size + 1}`,
          userId: data.userId,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
          usedAt: null,
        });
      }
      // Audit insert
      if (data.eventType) {
        auditLog.push(data);
      }
      return Promise.resolve();
    }),
  });

  const mockUpdate = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });

  const mockSelect = vi.fn().mockReturnValue({
    from: vi.fn().mockImplementation((table: unknown) => {
      if (table === usersTable) {
        return {
          where: vi.fn().mockReturnValue(asSelectResult(Array.from(users.values()))),
        };
      }

      if (table === passwordRecoveryTokens) {
        const validTokens = Array.from(tokens.values()).filter(
          (row) => row.usedAt === null && row.expiresAt > new Date(),
        );

        return {
          where: vi.fn().mockReturnValue(asSelectResult(validTokens)),
        };
      }

      if (table === sessions) {
        return {
          where: vi.fn().mockReturnValue(asSelectResult([])),
        };
      }

      return {
        where: vi.fn().mockReturnValue(asSelectResult([])),
      };
    }),
  });

  return {
    db: {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      _tokens: tokens,
      _users: users,
      _auditLog: auditLog,
    },
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Password Recovery — Integration', () => {
  let passwordService: PasswordService;
  let mockDb: ReturnType<typeof createRecoveryMockDb>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = createRecoveryMockDb();
    const mockEmailService = { sendPasswordResetEmail: vi.fn() };
    passwordService = new PasswordService(mockDb as any, mockEmailService as any);
  });

  // ─── Full recovery flow ─────────────────────────────────────────────────

  describe('Full recovery flow: request → verify → reset', () => {
    it('completes the full cycle successfully', async () => {
      // Step 1: Request recovery
      const token = await passwordService.requestRecovery(
        'recover@test.com',
        '192.168.1.1',
        'Chrome/120',
      );

      // Token was returned (in dev mode)
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Audit event was recorded
      expect(mockDb.db._auditLog.length).toBeGreaterThanOrEqual(1);

      // Step 2: Verify the token
      const verification = await passwordService.verifyRecoveryToken(token!);
      expect(verification.valid).toBe(true);
      expect(verification.userId).toBe('user-1');

      // Step 3: Reset password with the token
      const resetResult = await passwordService.resetWithRecovery(
        token!,
        'new-secure-password',
        '192.168.1.1',
        'Chrome/120',
      );

      expect(resetResult).toBe(true);
    });

    it('rehabilitates locked access state after valid recovery', async () => {
      const securityService = {
        clearFailedAttempts: vi.fn(),
      };
      const existingUser = mockDb.db._users.get('user-1');
      if (!existingUser) {
        throw new Error('Expected seeded recovery user');
      }
      mockDb.db._users.set('user-1', {
        ...existingUser,
        state: 'locked',
      });
      passwordService = new (PasswordService as any)(mockDb, securityService);

      const token = await passwordService.requestRecovery(
        'recover@test.com',
        '192.168.1.1',
        'Chrome/120',
      );

      const resetResult = await passwordService.resetWithRecovery(
        token!,
        'new-secure-password',
        '192.168.1.1',
        'Chrome/120',
      );

      expect(resetResult).toBe(true);
      expect(securityService.clearFailedAttempts).toHaveBeenCalledWith('recover@test.com');
      expect(mockDb.db._auditLog).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ eventType: AuditEventType.RECOVERY_COMPLETED }),
          expect.objectContaining({ eventType: AuditEventType.ACCOUNT_REHABILITATED }),
        ]),
      );
    });
  });

  // ─── Token expiration ───────────────────────────────────────────────────

  describe('Token expiration', () => {
    it('expired token is rejected during verification', async () => {
      // Create a service where tokens are expired
      const expiredDb = createRecoveryMockDb();

      // Manually insert an expired token
      expiredDb.db._tokens.set('expired-hash', {
        id: 'expired-token',
        userId: 'user-1',
        tokenHash: 'expired-hash',
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        usedAt: null,
      });

      // Override verifyRecoveryToken's select to return expired token
      expiredDb.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(asSelectResult([])), // Empty = no valid (non-expired) tokens
        }),
      });

      const expiredService = new PasswordService(expiredDb as any, { sendPasswordResetEmail: vi.fn() } as any);
      const result = await expiredService.verifyRecoveryToken('expired-token');
      expect(result.valid).toBe(false);
    });
  });

  // ─── Used token cannot be reused ────────────────────────────────────────

  describe('Token reuse prevention', () => {
    it('used token is rejected on second attempt', async () => {
      // Simulate the token has already been used
      const usedDb = createRecoveryMockDb();
      usedDb.db._tokens.set('used-hash', {
        id: 'used-token',
        userId: 'user-1',
        tokenHash: 'used-hash',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: new Date(), // Already used
      });

      // verifyRecoveryToken only selects unused tokens (usedAt IS NULL)
      usedDb.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(asSelectResult([])), // No unused tokens
        }),
      });

      const usedService = new PasswordService(usedDb as any, { sendPasswordResetEmail: vi.fn() } as any);
      const result = await usedService.verifyRecoveryToken('used-token');
      expect(result.valid).toBe(false);
    });
  });

  // ─── Invalid token rejected ─────────────────────────────────────────────

  describe('Invalid token', () => {
    it('random invalid token is rejected', async () => {
      const invalidDb = createRecoveryMockDb();
      // No tokens in store
      invalidDb.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(asSelectResult([])),
        }),
      });

      const invalidService = new PasswordService(invalidDb as any, { sendPasswordResetEmail: vi.fn() } as any);
      const result = await invalidService.verifyRecoveryToken('totally-invalid-token');
      expect(result.valid).toBe(false);
    });
  });

  // ─── Non-existent user ──────────────────────────────────────────────────

  describe('Non-existent user', () => {
    it('requestRecovery returns null for unknown email (no enumeration)', async () => {
      const unknownDb = createRecoveryMockDb();
      unknownDb.db.select = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // User not found
          }),
        }),
      });

      const unknownService = new PasswordService(unknownDb as any, { sendPasswordResetEmail: vi.fn() } as any);
      const result = await unknownService.requestRecovery('nobody@test.com', '1.1.1.1', 'UA');
      expect(result).toBeNull();
    });
  });
});
