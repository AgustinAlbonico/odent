import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and, gte, lte, lt } from 'drizzle-orm';
import { DatabaseService } from '../../infra/database/database.service.js';
import {
  userPermissions,
  permissionReviews,
  auditEvents,
  reviewStatusEnum,
  users,
} from '../../infra/database/schema.js';
import { AuditEventType } from '@sistema-odontologico/audit-core';

/**
 * Permission Review Service — periodic review cycles for sensitive permissions.
 *
 * Generates pending reviews, supports confirm/revoke decisions,
 * marks expired reviews, and preserves full audit trail.
 *
 * Covers RF-AA-026.
 */
@Injectable()
export class PermissionReviewService {
  constructor(private readonly dbService: DatabaseService) {}

  /**
   * Generate pending reviews for the current period.
   * Finds all active user_permissions and creates review records
   * for the specified period (or current month by default).
   *
   * Only admins with ADMIN_ROLES_PERMISSIONS should call this.
   */
  async generateReviews(
    periodStart: Date,
    periodEnd: Date,
    adminUser: { sub: string; email: string; tid: string; ip: string; userAgent: string },
  ): Promise<{ generated: number; skipped: number }> {
    // Find all active user permissions
    const allPermissions = await this.dbService.db.select().from(userPermissions);

    // Check which permissions already have a review in this period
    const existingReviews = await this.dbService.db
      .select({ permissionId: permissionReviews.permissionId })
      .from(permissionReviews)
      .where(
        and(
          gte(permissionReviews.periodStart, periodStart),
          lte(permissionReviews.periodStart, periodEnd),
        ),
      );

    const alreadyReviewed = new Set(existingReviews.map((r) => r.permissionId));

    let generated = 0;
    let skipped = 0;

    for (const perm of allPermissions) {
      if (alreadyReviewed.has(perm.id)) {
        skipped++;
        continue;
      }

      await this.dbService.db.insert(permissionReviews).values({
        userId: perm.userId,
        permissionId: perm.id,
        periodStart,
        periodEnd,
        status: 'pending',
      });

      generated++;
    }

    // Audit: reviews generated
    await this.dbService.db.insert(auditEvents).values({
      tenantId: adminUser.tid,
      eventType: AuditEventType.PERMISSION_GRANTED, // reuse: permission_review cycle initiated
      actorId: adminUser.sub,
      actorEmail: adminUser.email,
      ipAddress: adminUser.ip,
      userAgent: adminUser.userAgent,
      metadata: JSON.stringify({
        action: 'permission_reviews_generated',
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        generated,
        skipped,
      }),
    });

    return { generated, skipped };
  }

  /**
   * Confirm a pending review.
   * The permission stays active; the review is marked confirmed.
   */
  async confirmReview(
    reviewId: string,
    notes: string | undefined,
    adminUser: { sub: string; email: string; tid: string; ip: string; userAgent: string },
  ) {
    // Fetch the review
    const [review] = await this.dbService.db
      .select()
      .from(permissionReviews)
      .where(eq(permissionReviews.id, reviewId))
      .limit(1);

    if (!review) {
      throw new NotFoundException(`Review ${reviewId} not found`);
    }

    if (review.status !== 'pending') {
      throw new ForbiddenException(
        `Review is already ${review.status} — only pending reviews can be confirmed`,
      );
    }

    // Update the review
    await this.dbService.db
      .update(permissionReviews)
      .set({
        status: 'confirmed',
        reviewerId: adminUser.sub,
        reviewedAt: new Date(),
        notes: notes ?? null,
      })
      .where(eq(permissionReviews.id, reviewId));

    // Get the user + permission info for audit
    const [perm] = await this.dbService.db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.id, review.permissionId))
      .limit(1);

    const [targetUser] = await this.dbService.db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, review.userId))
      .limit(1);

    // Audit trail
    await this.dbService.db.insert(auditEvents).values({
      tenantId: adminUser.tid,
      eventType: AuditEventType.PERMISSION_REVIEW_CONFIRMED,
      actorId: adminUser.sub,
      actorEmail: adminUser.email,
      ipAddress: adminUser.ip,
      userAgent: adminUser.userAgent,
      metadata: JSON.stringify({
        reviewId,
        targetUserId: review.userId,
        targetUserEmail: targetUser?.email,
        permissionId: review.permissionId,
        permission: perm ? { module: perm.module, action: perm.action, scope: perm.scope } : null,
        notes,
      }),
    });

    return { reviewId, status: 'confirmed' };
  }

  /**
   * Revoke a pending review.
   * The permission is REMOVED from user_permissions;
   * the review is marked revoked.
   */
  async revokeReview(
    reviewId: string,
    notes: string | undefined,
    adminUser: { sub: string; email: string; tid: string; ip: string; userAgent: string },
  ) {
    // Fetch the review
    const [review] = await this.dbService.db
      .select()
      .from(permissionReviews)
      .where(eq(permissionReviews.id, reviewId))
      .limit(1);

    if (!review) {
      throw new NotFoundException(`Review ${reviewId} not found`);
    }

    if (review.status !== 'pending') {
      throw new ForbiddenException(
        `Review is already ${review.status} — only pending reviews can be revoked`,
      );
    }

    // Get the permission info BEFORE deleting (for audit)
    const [perm] = await this.dbService.db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.id, review.permissionId))
      .limit(1);

    const [targetUser] = await this.dbService.db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, review.userId))
      .limit(1);

    // Remove the permission from user_permissions
    await this.dbService.db
      .delete(userPermissions)
      .where(eq(userPermissions.id, review.permissionId));

    // Update the review
    await this.dbService.db
      .update(permissionReviews)
      .set({
        status: 'revoked',
        reviewerId: adminUser.sub,
        reviewedAt: new Date(),
        notes: notes ?? null,
      })
      .where(eq(permissionReviews.id, reviewId));

    // Audit trail
    await this.dbService.db.insert(auditEvents).values({
      tenantId: adminUser.tid,
      eventType: AuditEventType.PERMISSION_REVIEW_REVOKED,
      actorId: adminUser.sub,
      actorEmail: adminUser.email,
      ipAddress: adminUser.ip,
      userAgent: adminUser.userAgent,
      metadata: JSON.stringify({
        reviewId,
        targetUserId: review.userId,
        targetUserEmail: targetUser?.email,
        permissionId: review.permissionId,
        revokedPermission: perm
          ? { module: perm.module, action: perm.action, scope: perm.scope }
          : null,
        notes,
      }),
    });

    return { reviewId, status: 'revoked' };
  }

  /**
   * Mark expired reviews.
   * Any pending review whose periodEnd is in the past gets marked expired.
   */
  async markExpiredReviews(): Promise<{ expired: number }> {
    const now = new Date();

    // Find pending reviews past their period end
    const expired = await this.dbService.db
      .update(permissionReviews)
      .set({ status: 'expired' })
      .where(and(eq(permissionReviews.status, 'pending'), lt(permissionReviews.periodEnd, now)))
      .returning({ id: permissionReviews.id, userId: permissionReviews.userId });

    // Audit each expired review — look up user's tenant for proper isolation
    for (const review of expired) {
      const [targetUser] = await this.dbService.db
        .select({ tenantId: users.tenantId })
        .from(users)
        .where(eq(users.id, review.userId))
        .limit(1);

      await this.dbService.db.insert(auditEvents).values({
        tenantId: targetUser?.tenantId ?? 'system',
        eventType: AuditEventType.PERMISSION_REVIEW_EXPIRED,
        actorId: 'system',
        actorEmail: 'system',
        ipAddress: 'system',
        userAgent: 'system',
        metadata: JSON.stringify({
          reviewId: review.id,
          action: 'auto_expired',
        }),
      });
    }

    return { expired: expired.length };
  }

  /**
   * List reviews with optional filters.
   */
  async listReviews(filters: {
    status?: string;
    periodStart?: string;
    periodEnd?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { status, periodStart, periodEnd, page = 1, pageSize = 50 } = filters;

    const conditions = [];
    if (status)
      conditions.push(
        eq(permissionReviews.status, status as (typeof reviewStatusEnum.enumValues)[number]),
      );
    if (periodStart) conditions.push(gte(permissionReviews.periodStart, new Date(periodStart)));
    if (periodEnd) conditions.push(lte(permissionReviews.periodEnd, new Date(periodEnd)));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const ps = Math.min(pageSize, 100);

    const reviews = await this.dbService.db
      .select()
      .from(permissionReviews)
      .where(where)
      .limit(ps)
      .offset((page - 1) * ps);

    return {
      data: reviews,
      meta: { page, pageSize: ps },
    };
  }
}
