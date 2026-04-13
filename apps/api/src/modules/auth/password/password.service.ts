import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Optional,
  NotFoundException,
} from '@nestjs/common';
import { eq, and, gt, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../../infra/database/database.service.js';
import { users, passwordRecoveryTokens, sessions, auditEvents } from '../../../infra/database/schema.js';
import { AuditEventType } from '@sistema-odontologico/audit-core';
import { sql } from 'drizzle-orm';
import { SecurityService } from '../../security/security.service.js';
import { EmailService } from '../email/email.service.js';

@Injectable()
export class PasswordService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly emailService: EmailService,
    @Optional() private readonly securityService?: SecurityService,
  ) {}

  /**
   * Check if SMTP is configured.
   */
  private isSmtpConfigured(): boolean {
    const host = process.env.SMTP_HOST;
    return host !== undefined && host !== '';
  }

  /**
   * Request password recovery.
   * Always returns success (no email enumeration).
   */
  async requestRecovery(email: string, ipAddress: string, userAgent: string): Promise<string | null> {
    const userRows = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = userRows[0];
    if (!user) return null; // Don't leak existence

    // Generate recovery token
    const rawToken = uuidv4();
    const tokenHash = await bcrypt.hash(rawToken, 10);

    await this.dbService.db.insert(passwordRecoveryTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    // Audit
    await this.recordAudit(user.id, user.email, AuditEventType.RECOVERY_REQUESTED, ipAddress, userAgent, {}, user.tenantId!);

    if (this.isSmtpConfigured()) {
      // Send email with reset link
      await this.emailService.sendPasswordResetEmail(user.email, rawToken);
      return null;
    }

    // Dev mode: return token directly when no SMTP configured
    return rawToken;
  }

  /**
   * Verify a recovery token is valid.
   */
  async verifyRecoveryToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    // Find unused, non-expired tokens
    const allTokens = await this.dbService.db
      .select()
      .from(passwordRecoveryTokens)
      .where(
        and(
          isNull(passwordRecoveryTokens.usedAt),
          gt(passwordRecoveryTokens.expiresAt, new Date()),
        ),
      );

    for (const row of allTokens) {
      const match = await bcrypt.compare(token, row.tokenHash);
      if (match) {
        return { valid: true, userId: row.userId };
      }
    }

    return { valid: false };
  }

  /**
   * Reset password using recovery token.
   * Invalidates all prior sessions.
   */
  async resetWithRecovery(
    token: string,
    newPassword: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<boolean> {
    const verification = await this.verifyRecoveryToken(token);
    if (!verification.valid || !verification.userId) return false;

    const userRows = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.id, verification.userId))
      .limit(1);

    const user = userRows[0];
    if (!user) return false;

    const requiresRehabilitation =
      user.state !== 'active' ||
      (user.failedLoginAttempts ?? 0) > 0 ||
      user.lockedUntil != null;

    // Mark token as used
    const allTokens = await this.dbService.db
      .select()
      .from(passwordRecoveryTokens)
      .where(
        and(
          isNull(passwordRecoveryTokens.usedAt),
          eq(passwordRecoveryTokens.userId, verification.userId),
        ),
      );

    for (const row of allTokens) {
      const match = await bcrypt.compare(token, row.tokenHash);
      if (match) {
        await this.dbService.db
          .update(passwordRecoveryTokens)
          .set({ usedAt: new Date() })
          .where(eq(passwordRecoveryTokens.id, row.id));
        break;
      }
    }

    // Update password + increment token version (invalidates all sessions)
    const hash = await bcrypt.hash(newPassword, 12);
    await this.dbService.db
      .update(users)
      .set({
        passwordHash: hash,
        tokenVersion: sql`${users.tokenVersion} + 1`,
        mustChangePassword: false,
        state: 'active',
        failedLoginAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(users.id, verification.userId));

    // Close all sessions
    await this.dbService.db
      .update(sessions)
      .set({ closedAt: new Date(), closeReason: 'password_reset' })
      .where(eq(sessions.userId, verification.userId));

    this.securityService?.resetFailedAttempts(user.email);

    await this.recordAudit(user.id, user.email, AuditEventType.RECOVERY_COMPLETED, ipAddress, userAgent, {}, user.tenantId!);

    if (requiresRehabilitation) {
      await this.recordAudit(user.id, user.email, AuditEventType.ACCOUNT_REHABILITATED, ipAddress, userAgent, {
        source: 'recovery_reset',
      }, user.tenantId!);
    }

    return true;
  }

  /**
   * Voluntary password change.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<boolean> {
    const userRows = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = userRows[0];
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Contraseña actual incorrecta');

    const hash = await bcrypt.hash(newPassword, 12);
    await this.dbService.db
      .update(users)
      .set({ passwordHash: hash, tokenVersion: sql`${users.tokenVersion} + 1` })
      .where(eq(users.id, userId));

    await this.recordAudit(userId, user.email, AuditEventType.PASSWORD_CHANGED, ipAddress, userAgent, {}, user.tenantId!);

    return true;
  }

  /**
   * Forced password change (admin-triggered or first-login).
   */
  async forceChangePassword(
    userId: string,
    newPassword: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<boolean> {
    const userRows = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = userRows[0];
    if (!user) throw new UnauthorizedException();

    const hash = await bcrypt.hash(newPassword, 12);
    await this.dbService.db
      .update(users)
      .set({
        passwordHash: hash,
        mustChangePassword: false,
        state: 'active',
        tokenVersion: sql`${users.tokenVersion} + 1`,
      })
      .where(eq(users.id, userId));

    await this.securityService?.resetFailedAttempts(user.email);

    // Close all existing sessions (force re-login)
    await this.dbService.db
      .update(sessions)
      .set({ closedAt: new Date(), closeReason: 'forced_password_change' })
      .where(eq(sessions.userId, userId));

    await this.recordAudit(userId, user.email, AuditEventType.PASSWORD_FORCED_CHANGE, ipAddress, userAgent, {}, user.tenantId!);

    return true;
  }

  async rehabilitateAccount(
    userId: string,
    actor: { sub: string; email: string },
    ipAddress: string,
    userAgent: string,
  ): Promise<boolean> {
    const userRows = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = userRows[0];
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.dbService.db
      .update(users)
      .set({
        state: 'active',
        failedLoginAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(users.id, userId));

    await this.securityService?.resetFailedAttempts(user.email);

    await this.recordAudit(actor.sub, actor.email, AuditEventType.ACCOUNT_UNLOCKED, ipAddress, userAgent, {
      targetUserId: user.id,
      targetUserEmail: user.email,
      source: 'admin_rehabilitation',
    }, user.tenantId!);
    await this.recordAudit(user.id, user.email, AuditEventType.ACCOUNT_REHABILITATED, ipAddress, userAgent, {
      source: 'admin_rehabilitation',
      performedByUserId: actor.sub,
      performedByEmail: actor.email,
    }, user.tenantId!);

    return true;
  }

  private async recordAudit(
    actorId: string,
    actorEmail: string,
    eventType: AuditEventType,
    ipAddress: string,
    userAgent: string,
    metadata: Record<string, unknown>,
    tenantId: string,
  ) {
    await this.dbService.db.insert(auditEvents).values({
      tenantId,
      eventType,
      actorId,
      actorEmail,
      ipAddress,
      userAgent,
      metadata: JSON.stringify(metadata),
    });
  }
}
