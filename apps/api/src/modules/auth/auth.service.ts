import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../infra/database/database.service.js';
import { users, sessions, auditEvents } from '../../infra/database/schema.js';
import type { JwtPayload, RefreshTokenPayload, SessionContext, LoginResult } from '@sistema-odontologico/auth-core';
import { SecurityService } from '../security/security.service.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { AuditEventType } from '@sistema-odontologico/audit-core';
import { TenantService } from '../tenancy/tenancy.service.js';
import { SessionPolicyRuntimeService } from '../session-policy/session-policy-runtime.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly securityService: SecurityService,
    private readonly permissionsService: PermissionsService,
    private readonly tenantService: TenantService,
    private readonly sessionPolicyRuntimeService: SessionPolicyRuntimeService,
  ) {}

  /**
   * Login with email + password.
   * Creates secure JWT cookie session, binds to identity + institution + effective access context.
   */
  async login(
    email: string,
    password: string,
    ipAddress: string,
    userAgent: string,
    tenantId: string,
  ): Promise<
    LoginResult & {
      accessToken?: string;
      refreshToken?: string;
    }
  > {
    const tenant = await this.tenantService.resolveTenant(tenantId);
    if (!tenant) {
      throw new UnauthorizedException('Invalid tenant context');
    }

    // Find user
    const userRows = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = userRows[0];
    if (!user) {
      await this.securityService.recordFailedAttempt(email);
      return { success: false, reason: 'invalid_credentials' };
    }

    const lockStatus = await this.securityService.getAccountLockStatus(email);
    if (lockStatus) {
      await this.recordAudit(user.id, user.email, AuditEventType.LOGIN_FAILURE, ipAddress, userAgent, {
        attemptedEmail: email,
        reason: 'account_locked',
        source: 'temporary_lockout',
      });

      return { success: false, reason: 'account_locked' };
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      const failedAttempt = await this.securityService.recordFailedAttempt(email);

      await this.recordAudit(user.id, user.email, AuditEventType.LOGIN_FAILURE, ipAddress, userAgent, {
        attemptedEmail: email,
        reason: failedAttempt.locked ? 'account_locked' : 'invalid_credentials',
        failedAttempts: failedAttempt.attempts,
      });

      if (failedAttempt.locked) {
        await this.recordAudit(user.id, user.email, AuditEventType.ACCOUNT_LOCKED, ipAddress, userAgent, {
          attemptedEmail: email,
          lockedUntil: failedAttempt.lockedUntil?.toISOString() ?? null,
          source: 'failed_attempt_threshold',
        });

        return { success: false, reason: 'account_locked' };
      }

      return { success: false, reason: 'invalid_credentials' };
    }

    // Check account state
    if (user.state === 'inactive') {
      await this.recordAudit(user.id, user.email, AuditEventType.LOGIN_FAILURE, ipAddress, userAgent, {
        attemptedEmail: email,
        reason: 'account_inactive',
      });

      return { success: false, reason: 'account_inactive' };
    }
    if (user.state === 'locked') {
      await this.recordAudit(user.id, user.email, AuditEventType.LOGIN_FAILURE, ipAddress, userAgent, {
        attemptedEmail: email,
        reason: 'account_locked',
        source: 'account_state',
      });

      return { success: false, reason: 'account_locked' };
    }

    const now = new Date();
    const policy = await this.sessionPolicyRuntimeService.getRuntimePolicy();

    await this.sessionPolicyRuntimeService.enforceConcurrentSessionLimit(user.id, policy.maxConcurrentSessions, now, {
      userId: user.id,
      userEmail: user.email,
      ipAddress,
      userAgent,
    });

    // Generate tokens
    const tokenId = uuidv4();
    const permissions = await this.permissionsService.resolvePermissions(user.id, user.role);
    const accessTokenExpiresInSeconds = this.sessionPolicyRuntimeService.getAccessTokenExpiresInSeconds(
      policy,
      now,
      now,
    );

    const jwtPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      tid: tenantId,
      schema: tenant.schema,
      role: user.role,
      tokenVersion: user.tokenVersion,
      mustChangePassword: user.mustChangePassword,
      sid: tokenId,
    };

    const refreshTokenPayload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      sub: user.id,
      tid: tenantId,
      jti: tokenId,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload, {
      expiresIn: accessTokenExpiresInSeconds,
    });
    const refreshToken = await this.jwtService.signAsync(refreshTokenPayload, {
      expiresIn: `${policy.maxSessionDurationHours}h`,
    });

    // Store session
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.dbService.db.insert(sessions).values({
      id: tokenId,
      userId: user.id,
      refreshTokenHash,
      ipAddress,
      userAgent,
      expiresAt: new Date(now.getTime() + policy.maxSessionDurationHours * 60 * 60 * 1000),
      createdAt: now,
      lastActivityAt: now,
    });

    // Clear failed attempts
    await this.securityService.resetFailedAttempts(email);

    // Update last login
    await this.dbService.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Audit
    await this.recordAudit(user.id, user.email, AuditEventType.LOGIN_SUCCESS, ipAddress, userAgent, { tenantId });

    // Handle forced password change
    if (user.mustChangePassword || user.state === 'pending_password_change') {
      return {
        success: false,
        reason: 'pending_password_change',
        session: {
          sessionId: tokenId,
          userId: user.id,
          email: user.email,
          tenantId,
          schema: tenant.schema,
          role: user.role,
          tokenVersion: user.tokenVersion,
          mustChangePassword: true,
          createdAt: now,
          lastActivityAt: now,
          ipAddress,
          userAgent,
        },
        accessToken,
      };
    }

    return {
      success: true,
      session: {
        sessionId: tokenId,
        userId: user.id,
        email: user.email,
        tenantId,
        schema: tenant.schema,
        role: user.role,
        tokenVersion: user.tokenVersion,
        mustChangePassword: user.mustChangePassword,
        createdAt: now,
        lastActivityAt: now,
        ipAddress,
        userAgent,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Logout — invalidate the current session.
   */
  async logout(sessionId: string, userId: string, ipAddress: string, userAgent: string): Promise<void> {
    const userRows = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = userRows[0];

    // Close session
    await this.dbService.db
      .update(sessions)
      .set({
        closedAt: new Date(),
        closeReason: 'user_logout',
      })
      .where(eq(sessions.id, sessionId));

    if (user) {
      await this.recordAudit(userId, user.email, AuditEventType.LOGOUT, ipAddress, userAgent, {});
    }
  }

  /**
   * Refresh access token using refresh token.
   */
  async refresh(
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken);

      // Check token version
      const userRows = await this.dbService.db
        .select()
        .from(users)
        .where(eq(users.id, payload.sub))
        .limit(1);

      const user = userRows[0];
      if (!user || user.tokenVersion !== payload.tokenVersion) {
        return null;
      }

      const now = new Date();
      const activeSession = await this.sessionPolicyRuntimeService.validateRefreshSession(
        {
          sessionId: payload.jti,
          userId: user.id,
          userEmail: user.email,
          ipAddress,
          userAgent,
        },
        now,
      );

      if (!activeSession) {
        return null;
      }

      const tenant = await this.tenantService.resolveTenant(payload.tid);
      if (!tenant) {
        return null;
      }

      const policy = await this.sessionPolicyRuntimeService.getRuntimePolicy();
      const accessTokenExpiresInSeconds = this.sessionPolicyRuntimeService.getAccessTokenExpiresInSeconds(
        policy,
        activeSession.createdAt,
        now,
      );

      // Rotate tokens
      const newPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
        sub: user.id,
        email: user.email,
        tid: payload.tid,
        schema: tenant.schema,
        role: user.role,
        tokenVersion: user.tokenVersion,
        mustChangePassword: user.mustChangePassword,
        sid: activeSession.id,
      };

      const accessToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: accessTokenExpiresInSeconds,
      });
      const newRefreshToken = await this.jwtService.signAsync(
        {
          sub: user.id,
          tid: payload.tid,
          jti: activeSession.id,
          tokenVersion: user.tokenVersion,
        },
        { expiresIn: `${policy.maxSessionDurationHours}h` },
      );

      await this.recordAudit(user.id, user.email, AuditEventType.SESSION_REFRESHED, ipAddress, userAgent, {});

      return { accessToken, refreshToken: newRefreshToken };
    } catch {
      return null;
    }
  }

  private async recordAudit(
    actorId: string,
    actorEmail: string,
    eventType: AuditEventType,
    ipAddress: string,
    userAgent: string,
    metadata: Record<string, unknown>,
  ) {
    await this.dbService.db.insert(auditEvents).values({
      eventType,
      actorId,
      actorEmail,
      ipAddress,
      userAgent,
      metadata: JSON.stringify(metadata),
    });
  }
}
