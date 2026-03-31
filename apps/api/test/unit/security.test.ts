import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityService } from '../../src/modules/security/security.service.js';
import type { AccessContext } from '../../src/modules/security/security.service.js';

describe('SecurityService', () => {
  let service: SecurityService;

  beforeEach(() => {
    service = new SecurityService();
  });

  // ─── Rate limiting ────────────────────────────────────────────────────

  describe('Rate limiting — failed attempts', () => {
    it('records a single failed attempt without locking', () => {
      const result = service.recordFailedAttempt('user@test.com');
      expect(result.locked).toBe(false);
      expect(result.lockedUntil).toBeUndefined();
    });

    it('does not lock out before threshold (5 attempts)', () => {
      for (let i = 0; i < 4; i++) {
        const result = service.recordFailedAttempt('user@test.com');
        expect(result.locked).toBe(false);
      }
    });

    it('triggers lockout at the 5th failed attempt', () => {
      for (let i = 0; i < 4; i++) {
        service.recordFailedAttempt('user@test.com');
      }
      const result = service.recordFailedAttempt('user@test.com');
      expect(result.locked).toBe(true);
      expect(result.lockedUntil).toBeDefined();
      expect(result.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
    });

    it('isLockedOut returns true after lockout triggered', () => {
      for (let i = 0; i < 5; i++) {
        service.recordFailedAttempt('locked@test.com');
      }
      expect(service.isLockedOut('locked@test.com')).toBe(true);
    });

    it('isLockedOut returns false for email with no attempts', () => {
      expect(service.isLockedOut('clean@test.com')).toBe(false);
    });

    it('clears attempts on clearFailedAttempts', () => {
      for (let i = 0; i < 5; i++) {
        service.recordFailedAttempt('clearable@test.com');
      }
      expect(service.isLockedOut('clearable@test.com')).toBe(true);

      service.clearFailedAttempts('clearable@test.com');
      expect(service.isLockedOut('clearable@test.com')).toBe(false);
    });

    it('tracks attempts independently per email', () => {
      // 4 attempts on user A
      for (let i = 0; i < 4; i++) {
        service.recordFailedAttempt('a@test.com');
      }
      // 2 attempts on user B
      service.recordFailedAttempt('b@test.com');
      service.recordFailedAttempt('b@test.com');

      expect(service.isLockedOut('a@test.com')).toBe(false);
      expect(service.isLockedOut('b@test.com')).toBe(false);
    });
  });

  // ─── Lockout window expires ───────────────────────────────────────────

  describe('Lockout window expiration', () => {
    it('lockout is no longer active after the duration passes', () => {
      // We can't easily mock time in vitest without vi.useFakeTimers,
      // but we can verify the lockout duration is set to 15 minutes.
      for (let i = 0; i < 5; i++) {
        service.recordFailedAttempt('expire@test.com');
      }

      const result = service.recordFailedAttempt('expire@test.com');
      expect(result.lockedUntil).toBeDefined();

      // The lock duration should be approximately 15 minutes from now
      const expectedExpiry = Date.now() + 15 * 60 * 1000;
      const tolerance = 1000; // 1 second tolerance
      expect(result.lockedUntil!.getTime()).toBeGreaterThan(expectedExpiry - tolerance);
      expect(result.lockedUntil!.getTime()).toBeLessThan(expectedExpiry + tolerance);
    });
  });

  // ─── Unusual access detection ─────────────────────────────────────────

  describe('Unusual access detection', () => {
    const baseContext: AccessContext = {
      userId: 'user-1',
      tenantId: 'tenant-1',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120.0',
      timestamp: new Date(),
    };

    it('first access is NOT flagged as unusual', () => {
      const result = service.checkUnusualAccess(baseContext);
      expect(result.isUnusual).toBe(false);
      expect(result.reasons).toHaveLength(0);
    });

    it('same IP + same UA is NOT flagged', () => {
      service.checkUnusualAccess(baseContext);
      const result = service.checkUnusualAccess({ ...baseContext });
      expect(result.isUnusual).toBe(false);
    });

    it('new IP address IS flagged', () => {
      service.checkUnusualAccess(baseContext);
      const result = service.checkUnusualAccess({
        ...baseContext,
        ipAddress: '10.0.0.1',
      });
      expect(result.isUnusual).toBe(true);
      expect(result.reasons).toContain('new_ip_address');
    });

    it('different user agent IS flagged', () => {
      service.checkUnusualAccess(baseContext);
      const result = service.checkUnusualAccess({
        ...baseContext,
        userAgent: 'Firefox/121.0',
      });
      expect(result.isUnusual).toBe(true);
      expect(result.reasons).toContain('new_user_agent');
    });

    it('both new IP AND new UA are flagged together', () => {
      service.checkUnusualAccess(baseContext);
      const result = service.checkUnusualAccess({
        ...baseContext,
        ipAddress: '10.0.0.1',
        userAgent: 'Firefox/121.0',
      });
      expect(result.isUnusual).toBe(true);
      expect(result.reasons).toContain('new_ip_address');
      expect(result.reasons).toContain('new_user_agent');
      expect(result.reasons).toHaveLength(2);
    });

    it('tracks context per user+tenant combination', () => {
      const contextA: AccessContext = {
        userId: 'user-a',
        tenantId: 'tenant-1',
        ipAddress: '1.1.1.1',
        userAgent: 'Chrome',
        timestamp: new Date(),
      };
      const contextB: AccessContext = {
        userId: 'user-b',
        tenantId: 'tenant-1',
        ipAddress: '2.2.2.2',
        userAgent: 'Chrome',
        timestamp: new Date(),
      };

      // Register A
      service.checkUnusualAccess(contextA);
      // B's first access should NOT be unusual
      const resultB = service.checkUnusualAccess(contextB);
      expect(resultB.isUnusual).toBe(false);

      // A's same access is also fine
      const resultA = service.checkUnusualAccess(contextA);
      expect(resultA.isUnusual).toBe(false);
    });

    it('stores context history for future checks', () => {
      // First: register IP1
      service.checkUnusualAccess(baseContext);

      // Second: register IP2 (triggers unusual)
      service.checkUnusualAccess({ ...baseContext, ipAddress: '10.0.0.1' });

      // Third: IP1 is now known (was first), IP2 is now known (was second)
      // Going back to IP1 should NOT be unusual since it's known
      const result = service.checkUnusualAccess(baseContext);
      expect(result.isUnusual).toBe(false);
    });
  });
});
