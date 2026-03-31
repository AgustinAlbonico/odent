import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecurityService } from '../../src/modules/security/security.service.js';

function createMockDbService() {
  const selectResult = { rows: [] as any[] };
  const updateResult = { executed: true };

  const db = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  };

  // Chain: select(...).from(...).where(...).limit(1) => returns rows
  db.select.mockReturnValue(db);
  db.from.mockReturnValue(db);
  db.where.mockReturnValue(db);
  db.limit.mockReturnValue(db);

  // Chain: update(...).set(...).where(...) => returns result
  db.update.mockReturnValue(db);
  db.set.mockReturnValue(db);

  return {
    db,
    selectResult,
    updateResult,
    /** Set the user row that will be returned by select queries */
    setSelectRow(row: any) {
      selectResult.rows = [row];
      db.limit.mockResolvedValueOnce(selectResult.rows);
    },
    /** Set the result of update queries */
    setUpdateResult(result: any) {
      db.where.mockResolvedValueOnce([result]);
    },
  };
}

describe('SecurityService', () => {
  let mockDb: ReturnType<typeof createMockDbService>;
  let service: SecurityService;

  beforeEach(() => {
    mockDb = createMockDbService();
    service = new SecurityService(mockDb as any);
  });

  // ─── Rate limiting ────────────────────────────────────────────────────

  describe('Rate limiting — failed attempts', () => {
    it('records a single failed attempt without locking', async () => {
      mockDb.setSelectRow({ failedLoginAttempts: 0, lockedUntil: null });

      const result = await service.recordFailedAttempt('user@test.com');
      expect(result.locked).toBe(false);
      expect(result.lockedUntil).toBeUndefined();
      expect(result.attempts).toBe(1);
    });

    it('does not lock out before threshold (5 attempts)', async () => {
      for (let i = 0; i < 4; i++) {
        mockDb.setSelectRow({ failedLoginAttempts: i, lockedUntil: null });
        const result = await service.recordFailedAttempt('user@test.com');
        expect(result.locked).toBe(false);
      }
    });

    it('triggers lockout at the 5th failed attempt', async () => {
      mockDb.setSelectRow({ failedLoginAttempts: 4, lockedUntil: null });

      const result = await service.recordFailedAttempt('user@test.com');
      expect(result.locked).toBe(true);
      expect(result.lockedUntil).toBeDefined();
      expect(result.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
    });

    it('returns generic response for non-existent user', async () => {
      mockDb.setSelectRow(undefined);

      const result = await service.recordFailedAttempt('unknown@test.com');
      expect(result.locked).toBe(false);
      expect(result.attempts).toBe(0);
    });
  });

  // ─── Lockout window ───────────────────────────────────────────────────

  describe('Lockout window', () => {
    it('getAccountLockStatus returns null when not locked', async () => {
      mockDb.setSelectRow({ lockedUntil: null });

      const status = await service.getAccountLockStatus('user@test.com');
      expect(status).toBeNull();
    });

    it('getAccountLockStatus returns lock time when locked', async () => {
      const futureLock = new Date(Date.now() + 10 * 60 * 1000); // 10 min from now
      mockDb.setSelectRow({ lockedUntil: futureLock });

      const status = await service.getAccountLockStatus('user@test.com');
      expect(status).toEqual(futureLock);
    });

    it('getAccountLockStatus clears expired locks', async () => {
      const pastLock = new Date(Date.now() - 10 * 60 * 1000); // 10 min ago
      mockDb.setSelectRow({ lockedUntil: pastLock });

      const status = await service.getAccountLockStatus('user@test.com');
      expect(status).toBeNull();
    });

    it('does not increment attempts while locked', async () => {
      const futureLock = new Date(Date.now() + 10 * 60 * 1000);
      mockDb.setSelectRow({ failedLoginAttempts: 5, lockedUntil: futureLock });

      const result = await service.recordFailedAttempt('user@test.com');
      expect(result.locked).toBe(true);
      expect(result.attempts).toBe(5);
      expect(result.lockedUntil).toEqual(futureLock);
    });
  });

  // ─── Reset failed attempts ────────────────────────────────────────────

  describe('Reset failed attempts', () => {
    it('resets failed attempts after successful login', async () => {
      await service.resetFailedAttempts('user@test.com');
      // If no error thrown, the update was called
      expect(mockDb.db.update).toHaveBeenCalled();
    });
  });

  // ─── Remaining attempts ───────────────────────────────────────────────

  describe('Remaining attempts', () => {
    it('returns max attempts when no failures', async () => {
      mockDb.setSelectRow({ failedLoginAttempts: 0 });

      const remaining = await service.getRemainingAttempts('user@test.com');
      expect(remaining).toBe(5);
    });

    it('returns remaining after some failures', async () => {
      mockDb.setSelectRow({ failedLoginAttempts: 3 });

      const remaining = await service.getRemainingAttempts('user@test.com');
      expect(remaining).toBe(2);
    });

    it('returns zero when at max', async () => {
      mockDb.setSelectRow({ failedLoginAttempts: 5 });

      const remaining = await service.getRemainingAttempts('user@test.com');
      expect(remaining).toBe(0);
    });
  });
});
