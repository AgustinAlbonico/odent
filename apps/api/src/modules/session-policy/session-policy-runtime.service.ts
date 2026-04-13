import { Injectable, UnauthorizedException } from '@nestjs/common';
import { and, asc, eq, gt, isNull } from 'drizzle-orm';
import { AuditEventType } from '@sistema-odontologico/audit-core';
import type { SessionPolicyInput } from '@sistema-odontologico/validation';
import { DatabaseService } from '../../infra/database/database.service.js';
import { auditEvents, sessions } from '../../infra/database/schema.js';
import { SessionPolicyService } from './session-policy.service.js';

interface SessionActorContext {
  sessionId: string;
  userId: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  tenantId?: string;
}

type SessionRecord = typeof sessions.$inferSelect;

@Injectable()
export class SessionPolicyRuntimeService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly sessionPolicyService: SessionPolicyService,
  ) {}

  async getRuntimePolicy(tenantId: string): Promise<SessionPolicyInput> {
    return this.sessionPolicyService.getRuntimePolicy(tenantId);
  }

  getAccessTokenExpiresInSeconds(
    policy: SessionPolicyInput,
    sessionCreatedAt: Date,
    now = new Date(),
  ): number {
    const inactivitySeconds = (policy.inactivityTimeoutMinutes ?? 30) * 60;
    const remainingDurationSeconds = Math.floor(
      (sessionCreatedAt.getTime() +
        (policy.maxSessionDurationHours ?? 8) * 60 * 60 * 1000 -
        now.getTime()) /
        1000,
    );

    return Math.max(1, Math.min(15 * 60, inactivitySeconds, remainingDurationSeconds));
  }

  async enforceConcurrentSessionLimit(
    userId: string,
    maxConcurrentSessions: number,
    now: Date,
    actor: Omit<SessionActorContext, 'sessionId'>,
    tenantId: string,
  ): Promise<void> {
    const activeSessions = await this.dbService.db
      .select()
      .from(sessions)
      .where(
        and(eq(sessions.userId, userId), isNull(sessions.closedAt), gt(sessions.expiresAt, now)),
      )
      .orderBy(asc(sessions.createdAt));

    const sessionsToClose = activeSessions.slice(
      0,
      Math.max(0, activeSessions.length - maxConcurrentSessions + 1),
    );

    for (const activeSession of sessionsToClose) {
      await this.closeSession(activeSession.id, 'max_concurrent_sessions', now);
      await this.recordSessionExpiredAudit(
        {
          ...actor,
          sessionId: activeSession.id,
        },
        'max_concurrent_sessions',
        tenantId,
      );
    }
  }

  async validateAccessSession(
    context: SessionActorContext,
    now = new Date(),
  ): Promise<SessionRecord> {
    const session = await this.findActiveSession(context.sessionId, context.userId, now);

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    const tenantId = context.tenantId ?? '';
    const reason = await this.resolveExpirationReason(session, now, tenantId);
    if (reason) {
      await this.expireSession(context, reason, now, tenantId);
      throw new UnauthorizedException('Session expired by policy');
    }

    await this.touchLastActivity(session.id, now);
    return session;
  }

  async validateRefreshSession(
    context: SessionActorContext,
    now = new Date(),
    tenantId?: string,
  ): Promise<SessionRecord | null> {
    const session = await this.findActiveSession(context.sessionId, context.userId, now);

    if (!session) {
      return null;
    }

    const effectiveTenantId = tenantId ?? context.tenantId ?? '';
    const reason = await this.resolveExpirationReason(session, now, effectiveTenantId);
    if (reason) {
      await this.expireSession(context, reason, now, effectiveTenantId);
      return null;
    }

    await this.touchLastActivity(session.id, now);
    return session;
  }

  private async findActiveSession(sessionId: string, userId: string, now: Date) {
    const [session] = await this.dbService.db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, sessionId),
          eq(sessions.userId, userId),
          isNull(sessions.closedAt),
          gt(sessions.expiresAt, now),
        ),
      )
      .limit(1);

    return session;
  }

  private async resolveExpirationReason(session: SessionRecord, now: Date, tenantId: string) {
    const policy = await this.sessionPolicyService.getRuntimePolicy(tenantId);

    const inactivityDeadline =
      session.lastActivityAt.getTime() + (policy.inactivityTimeoutMinutes ?? 30) * 60 * 1000;
    if (now.getTime() > inactivityDeadline) {
      return 'inactivity_timeout' as const;
    }

    const durationDeadline =
      session.createdAt.getTime() + (policy.maxSessionDurationHours ?? 8) * 60 * 60 * 1000;
    if (now.getTime() > durationDeadline) {
      return 'max_duration_reached' as const;
    }

    return null;
  }

  private async expireSession(
    context: SessionActorContext,
    reason: 'inactivity_timeout' | 'max_duration_reached',
    now: Date,
    tenantId: string,
  ) {
    await this.closeSession(context.sessionId, reason, now);
    await this.recordSessionExpiredAudit(context, reason, tenantId);
  }

  private async touchLastActivity(sessionId: string, now: Date) {
    await this.dbService.db
      .update(sessions)
      .set({ lastActivityAt: now })
      .where(eq(sessions.id, sessionId));
  }

  private async closeSession(sessionId: string, reason: string, now: Date) {
    await this.dbService.db
      .update(sessions)
      .set({
        closedAt: now,
        closeReason: reason,
      })
      .where(eq(sessions.id, sessionId));
  }

  private async recordSessionExpiredAudit(
    context: SessionActorContext,
    reason: string,
    tenantId: string,
  ) {
    await this.dbService.db.insert(auditEvents).values({
      tenantId,
      eventType: AuditEventType.SESSION_EXPIRED,
      actorId: context.userId,
      actorEmail: context.userEmail,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: JSON.stringify({
        sessionId: context.sessionId,
        reason,
      }),
    });
  }
}
