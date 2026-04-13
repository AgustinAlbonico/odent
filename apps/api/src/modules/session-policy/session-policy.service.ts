import { Injectable } from '@nestjs/common';
import { desc, eq, and } from 'drizzle-orm';
import { AuditEventType } from '@sistema-odontologico/audit-core';
import type { SessionPolicyInput } from '@sistema-odontologico/validation';
import { DatabaseService } from '../../infra/database/database.service.js';
import { auditEvents, sessionPolicies } from '../../infra/database/schema.js';

export const DEFAULT_SESSION_POLICY: SessionPolicyInput = {
  inactivityTimeoutMinutes: 30,
  maxSessionDurationHours: 8,
  maxConcurrentSessions: 3,
};

interface SessionPolicyActorContext {
  userId: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
}

type SessionPolicyRecord = typeof sessionPolicies.$inferSelect;

@Injectable()
export class SessionPolicyService {
  constructor(private readonly dbService: DatabaseService) {}

  async getRuntimePolicy(tenantId: string): Promise<SessionPolicyInput> {
    const existingPolicy = await this.findLatestPolicy(tenantId);

    return existingPolicy ? this.toPolicyDto(existingPolicy) : DEFAULT_SESSION_POLICY;
  }

  async getPolicy(updatedByUserId: string, tenantId: string): Promise<SessionPolicyInput> {
    const existingPolicy = await this.findLatestPolicy(tenantId);

    if (existingPolicy) {
      return this.toPolicyDto(existingPolicy);
    }

    const [createdPolicy] = await this.dbService.db
      .insert(sessionPolicies)
      .values({
        ...DEFAULT_SESSION_POLICY,
        tenantId,
        updatedBy: updatedByUserId,
        updatedAt: new Date(),
      })
      .returning();

    return this.toPolicyDto(this.ensurePolicy(createdPolicy));
  }

  async updatePolicy(
    policy: SessionPolicyInput,
    actor: SessionPolicyActorContext,
    tenantId: string,
  ): Promise<SessionPolicyInput> {
    const currentPolicy = await this.findLatestPolicy(tenantId);
    const now = new Date();

    const [savedPolicy] = currentPolicy
      ? await this.dbService.db
          .update(sessionPolicies)
          .set({
            ...policy,
            updatedBy: actor.userId,
            updatedAt: now,
          })
          .where(eq(sessionPolicies.id, currentPolicy.id))
          .returning()
      : await this.dbService.db
          .insert(sessionPolicies)
          .values({
            ...policy,
            tenantId,
            updatedBy: actor.userId,
            updatedAt: now,
          })
          .returning();

    await this.dbService.db.insert(auditEvents).values({
      tenantId,
      eventType: AuditEventType.SESSION_POLICY_UPDATED,
      actorId: actor.userId,
      actorEmail: actor.userEmail,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
      metadata: JSON.stringify({
        previous: currentPolicy ? this.toPolicyDto(currentPolicy) : null,
        next: this.toPolicyDto(this.ensurePolicy(savedPolicy)),
      }),
    });

    return this.toPolicyDto(this.ensurePolicy(savedPolicy));
  }

  private async findLatestPolicy(tenantId: string) {
    const [policy] = await this.dbService.db
      .select()
      .from(sessionPolicies)
      .where(eq(sessionPolicies.tenantId, tenantId))
      .orderBy(desc(sessionPolicies.updatedAt))
      .limit(1);

    return policy;
  }

  private ensurePolicy(policy: SessionPolicyRecord | undefined): SessionPolicyRecord {
    if (!policy) {
      throw new Error('Session policy persistence did not return a row');
    }

    return policy;
  }

  private toPolicyDto(policy: SessionPolicyRecord): SessionPolicyInput {
    return {
      inactivityTimeoutMinutes: policy.inactivityTimeoutMinutes,
      maxSessionDurationHours: policy.maxSessionDurationHours,
      maxConcurrentSessions: policy.maxConcurrentSessions,
    };
  }
}
