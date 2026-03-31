import { Injectable } from '@nestjs/common';

/**
 * Unusual access detection parameters.
 */
export interface AccessContext {
  userId: string;
  tenantId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface UnusualAccessResult {
  isUnusual: boolean;
  reasons: string[];
}

/**
 * Security service — rate limiting, unusual access detection.
 * Uses stateless checks (no Redis in this version).
 */
@Injectable()
export class SecurityService {
  // In-memory rate limit store (per process; will migrate to Redis later)
  private readonly failedAttempts = new Map<string, { count: number; lockedUntil: Date | null }>();
  private readonly knownContexts = new Map<string, AccessContext[]>();

  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  /**
   * Record a failed login attempt.
   * Returns whether the account should be temporarily locked.
   */
  recordFailedAttempt(email: string): { locked: boolean; lockedUntil?: Date; count: number } {
    const current = this.failedAttempts.get(email) ?? { count: 0, lockedUntil: null };

    current.count += 1;

    if (current.count >= SecurityService.MAX_FAILED_ATTEMPTS) {
      current.lockedUntil = new Date(Date.now() + SecurityService.LOCK_DURATION_MS);
      this.failedAttempts.set(email, current);
      return { locked: true, lockedUntil: current.lockedUntil, count: current.count };
    }

    this.failedAttempts.set(email, current);
    return { locked: false, count: current.count };
  }

  /**
   * Check if an email is currently locked out.
   */
  isLockedOut(email: string): boolean {
    const entry = this.failedAttempts.get(email);
    if (!entry?.lockedUntil) return false;

    if (new Date() >= entry.lockedUntil) {
      // Lock expired
      this.failedAttempts.delete(email);
      return false;
    }

    return true;
  }

  /**
   * Clear failed attempts (after successful login or admin unlock).
   */
  clearFailedAttempts(email: string): void {
    this.failedAttempts.delete(email);
  }

  /**
   * Check if an access context is unusual.
   * Simple heuristics: new IP, different user agent, etc.
   */
  checkUnusualAccess(context: AccessContext): UnusualAccessResult {
    const reasons: string[] = [];
    const key = `${context.tenantId}:${context.userId}`;
    const history = this.knownContexts.get(key) ?? [];

    if (history.length > 0) {
      const knownIps = new Set(history.map((h) => h.ipAddress));
      if (!knownIps.has(context.ipAddress)) {
        reasons.push('new_ip_address');
      }

      const knownAgents = new Set(history.map((h) => h.userAgent));
      if (!knownAgents.has(context.userAgent)) {
        reasons.push('new_user_agent');
      }
    }

    // Store context for future checks
    history.push(context);
    // Keep last 50 entries
    if (history.length > 50) history.shift();
    this.knownContexts.set(key, history);

    return {
      isUnusual: reasons.length > 0,
      reasons,
    };
  }
}
