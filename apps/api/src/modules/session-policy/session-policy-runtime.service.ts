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
}

type SessionRecord = typeof sessions.$inferSelect;

@Injectable()
export class SessionPolicyRuntimeService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly sessionPolicyService: SessionPolicyService,
  ) {}

  async getRuntimePolicy(): Promise<SessionPolicyInput> {
    return this.sessionPolicyService.getRuntimePolicy();
  }

  getAccessTokenExpiresInSeconds(
    policy: SessionPolicyInput,
    sessionCreatedAt: Date,
    now = new Date(),
  ): number {
    const inactivitySeconds = policy.inactivityTimeoutMinutes * 60;
    const remainingDurationSeconds = Math.floor(
      (sessionCreatedAt.getTime() + policy.maxSessionDurationHours * 60 * 60 * 1000 - now.getTime()) / 1000,
    );

    return Math.max(1, Math.min(15 * 60, inactivitySeconds, remainingDurationSeconds));
  }

  async enforceConcurrentSessionLimit(
    userId: string,
    maxConcurrentSessions: number,
    now: Date,
    actor: Omit<SessionActorContext, 'sessionId'>,
  ): Promise<void> {
    const activeSessions = await this.dbService.db
      .select()
      .from(sessions)
      .where(
        and(eq(sessions.userId, userId), isNull(sessions.closedAt), gt(sessions.expiresAt, now)),
      )
      .orderBy(asc(sessions.createdAt));

    const sessionsToClose = activeSessions.slice(0, Math.max(0, activeSessions.length - maxConcurrentSessions + 1));

    for (const activeSession of sessionsToClose) {
      await this.closeSession(activeSession.id, 'max_concurrent_sessions', now);
      await this.recordSessionExpiredAudit(
        {
          ...actor,
          sessionId: activeSession.id,
        },
        'max_concurrent_sessions',
      );
    }
  }

  async validateAccessSession(context: SessionActorContext, now = new Date()): Promise<SessionRecord> {
    const session = await this.findActiveSession(context.sessionId, context.userId, now);

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    const reason = await this.resolveExpirationReason(session, now);
    if (reason) {
      await this.expireSession(context, reason, now);
      throw new UnauthorizedException('Session expired by policy');
    }

    await this.touchLastActivity(session.id, now);
    return session;
  }

  async validateRefreshSession(context: SessionActorContext, now = new Date()): Promise<SessionRecord | null> {
    const session = await this.findActiveSession(context.sessionId, context.userId, now);

    if (!session) {
      return null;
    }

    const reason = await this.resolveExpirationReason(session, now);
    if (reason) {
      await this.expireSession(context, reason, now);
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

  private async resolveExpirationReason(session: SessionRecord, now: Date) {
    const policy = await this.sessionPolicyService.getRuntimePolicy();

    const inactivityDeadline = session.lastActivityAt.getTime() + policy.inactivityTimeoutMinutes * 60 * 1000;
    if (now.getTime() > inactivityDeadline) {
      return 'inactivity_timeout' as const;
    }

    const durationDeadline = session.createdAt.getTime() + policy.maxSessionDurationHours * 60 * 60 * 1000;
    if (now.getTime() > durationDeadline) {
      return 'max_duration_reached' as const;
    }

    return null;
  }

  private async expireSession(
    context: SessionActorContext,
    reason: 'inactivity_timeout' | 'max_duration_reached',
    now: Date,
  ) {
    await this.closeSession(context.sessionId, reason, now);
    await this.recordSessionExpiredAudit(context, reason);
  }

  private async touchLastActivity(sessionId: string, now: Date) {
    await this.dbService.db.update(sessions).set({ lastActivityAt: now }).where(eq(sessions.id, sessionId));
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

  private async recordSessionExpiredAudit(context: SessionActorContext, reason: string) {
    await this.dbService.db.insert(auditEvents).values({
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
