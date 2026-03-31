import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../infra/database/database.service.js';
import { users } from '../../infra/database/schema.js';

/**
 * Security service — brute-force lockout tracking backed by the database.
 * Persists failed login attempts on the users table so state survives
 * restarts and works across multiple instances.
 */
@Injectable()
export class SecurityService {
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  constructor(private readonly dbService: DatabaseService) {}

  /**
   * Check if an account is currently locked.
   * Returns the lock expiry time if locked, null otherwise.
   * Automatically clears expired locks.
   */
  async getAccountLockStatus(email: string): Promise<Date | null> {
    const [user] = await this.dbService.db
      .select({ lockedUntil: users.lockedUntil })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user?.lockedUntil) return null;

    // If lock has expired, clear it
    if (new Date() > user.lockedUntil) {
      await this.dbService.db
        .update(users)
        .set({ lockedUntil: null, failedLoginAttempts: 0 })
        .where(eq(users.email, email));
      return null;
    }

    return user.lockedUntil;
  }

  /**
   * Record a failed login attempt.
   * Returns { locked: boolean, attempts: number, lockedUntil?: Date }
   */
  async recordFailedAttempt(email: string): Promise<{
    locked: boolean;
    attempts: number;
    lockedUntil?: Date;
  }> {
    const [user] = await this.dbService.db
      .select({
        failedLoginAttempts: users.failedLoginAttempts,
        lockedUntil: users.lockedUntil,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // User doesn't exist — return generic response to prevent enumeration
      return { locked: false, attempts: 0 };
    }

    // If currently locked, don't increment
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      return { locked: true, attempts: user.failedLoginAttempts ?? 0, lockedUntil: user.lockedUntil };
    }

    const newAttempts = (user.failedLoginAttempts ?? 0) + 1;

    if (newAttempts >= SecurityService.MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + SecurityService.LOCK_DURATION_MS);

      await this.dbService.db
        .update(users)
        .set({
          failedLoginAttempts: newAttempts,
          lockedUntil,
        })
        .where(eq(users.email, email));

      return { locked: true, attempts: newAttempts, lockedUntil };
    }

    await this.dbService.db
      .update(users)
      .set({ failedLoginAttempts: newAttempts })
      .where(eq(users.email, email));

    return { locked: false, attempts: newAttempts };
  }

  /**
   * Reset failed attempts after successful login.
   */
  async resetFailedAttempts(email: string): Promise<void> {
    await this.dbService.db
      .update(users)
      .set({ failedLoginAttempts: 0, lockedUntil: null })
      .where(eq(users.email, email));
  }

  /**
   * Get the number of remaining attempts before lockout.
   */
  async getRemainingAttempts(email: string): Promise<number> {
    const [user] = await this.dbService.db
      .select({ failedLoginAttempts: users.failedLoginAttempts })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return Math.max(0, SecurityService.MAX_FAILED_ATTEMPTS - (user?.failedLoginAttempts ?? 0));
  }
}
