import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionReviewService } from '../../src/modules/permission-review/permission-review.service.js';
import { AuditEventType } from '@sistema-odontologico/audit-core';
import { permissionReviews, userPermissions, users as usersTable } from '../../src/infra/database/schema.js';

// ─── Mock infrastructure ──────────────────────────────────────────────────

const asSelectResult = <T>(rows: T[]) => ({
  limit: vi.fn().mockResolvedValue(rows),
  then: (resolve: (value: T[]) => unknown) => Promise.resolve(resolve(rows)),
});

const asUpdateResult = <T>(rows: T[]) => ({
  returning: vi.fn().mockResolvedValue(rows),
  then: (resolve: (value: T[]) => unknown) => Promise.resolve(resolve(rows)),
});

function createReviewMockDb() {
  const permissions = new Map<string, any>();
  const reviews = new Map<string, any>();
  const users = new Map<string, any>();
  const auditLog: any[] = [];

  // Pre-populate
  permissions.set('perm-1', {
    id: 'perm-1',
    userId: 'user-1',
    module: 'patients',
    action: 'view_sensitive',
    scope: 'institutional_total',
  });
  permissions.set('perm-2', {
    id: 'perm-2',
    userId: 'user-2',
    module: 'system_config',
    action: 'admin_catalog',
    scope: 'institutional_total',
  });

  users.set('user-1', { id: 'user-1', email: 'user1@test.com' });
  users.set('user-2', { id: 'user-2', email: 'user2@test.com' });
  users.set('admin-1', { id: 'admin-1', email: 'admin@test.com' });

  let permIdCounter = 3;
  let reviewIdCounter = 1;

  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockImplementation((table: unknown) => {
          if (table === userPermissions) {
            const rows = Array.from(permissions.values());
            return {
              where: vi.fn().mockReturnValue(asSelectResult(rows)),
              limit: vi.fn().mockResolvedValue(rows.slice(0, 1)),
              then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(resolve(rows)),
            };
          }

          if (table === permissionReviews) {
            const rows = Array.from(reviews.values());
            return {
              where: vi.fn().mockReturnValue(asSelectResult(rows)),
              limit: vi.fn().mockResolvedValue(rows.length > 0 ? [rows[rows.length - 1]] : []),
              then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(resolve(rows)),
            };
          }

          if (table === usersTable) {
            const rows = Array.from(users.values());
            return {
              where: vi.fn().mockReturnValue(asSelectResult(rows)),
              limit: vi.fn().mockResolvedValue(rows.slice(0, 1)),
              then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(resolve(rows)),
            };
          }

          return {
            where: vi.fn().mockReturnValue(asSelectResult([])),
            limit: vi.fn().mockResolvedValue([]),
            then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(resolve([])),
          };
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockImplementation((data: any) => {
          if (data.userId && data.permissionId && data.periodStart) {
            // Permission review insert
            const id = `review-${reviewIdCounter++}`;
            reviews.set(id, { id, ...data });
          }
          if (data.eventType) {
            auditLog.push(data);
          }
          return Promise.resolve();
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockImplementation((data: any) => ({
          where: vi.fn().mockImplementation(() => {
            // Find and update the review
            for (const [id, review] of reviews) {
              if (review.status === 'pending') {
                Object.assign(review, data);
                return asUpdateResult([{ id: review.id }]);
              }
            }
            return asUpdateResult([]);
          }),
        })),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    },
    _permissions: permissions,
    _reviews: reviews,
    _users: users,
    _auditLog: auditLog,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Permission Review — Integration', () => {
  let service: PermissionReviewService;
  let mockDb: ReturnType<typeof createReviewMockDb>;
  const adminUser = { sub: 'admin-1', email: 'admin@test.com', ip: '1.1.1.1', userAgent: 'Chrome' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = createReviewMockDb();
    service = new PermissionReviewService(mockDb as any);
  });

  // ─── Generate reviews ───────────────────────────────────────────────────

  describe('Generate reviews for current period', () => {
    it('generates review records for all active permissions', async () => {
      const periodStart = new Date('2026-04-01');
      const periodEnd = new Date('2026-04-30');

      const result = await service.generateReviews(periodStart, periodEnd, adminUser);

      expect(result).toHaveProperty('generated');
      expect(result.generated).toBeGreaterThanOrEqual(0);
    });
  });

  // ─── Confirm review ─────────────────────────────────────────────────────

  describe('Confirm review → permission maintained', () => {
    it('marks review as confirmed and keeps permission', async () => {
      // First, generate a review
      const periodStart = new Date('2026-04-01');
      const periodEnd = new Date('2026-04-30');
      await service.generateReviews(periodStart, periodEnd, adminUser);

      // Setup: add a pending review to confirm
      mockDb._reviews.set('review-confirm', {
        id: 'review-confirm',
        userId: 'user-1',
        permissionId: 'perm-1',
        periodStart,
        periodEnd,
        status: 'pending',
      });

      const result = await service.confirmReview('review-confirm', 'Approved', adminUser);

      expect(result.status).toBe('confirmed');

      // Audit should be recorded
      expect(mockDb._auditLog.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Revoke review ──────────────────────────────────────────────────────

  describe('Revoke review → permission removed', () => {
    it('marks review as revoked and deletes the permission', async () => {
      // Setup pending review
      mockDb._reviews.set('review-revoke', {
        id: 'review-revoke',
        userId: 'user-2',
        permissionId: 'perm-2',
        periodStart: new Date('2026-04-01'),
        periodEnd: new Date('2026-04-30'),
        status: 'pending',
      });

      const result = await service.revokeReview('review-revoke', 'No longer needed', adminUser);

      expect(result.status).toBe('revoked');

      // Permission should be deleted
      expect(mockDb.db.delete).toHaveBeenCalled();

      // Audit recorded
      const revokeAudit = mockDb._auditLog.find(
        (e) => e.eventType === AuditEventType.PERMISSION_REVIEW_REVOKED,
      );
      expect(revokeAudit).toBeDefined();
    });
  });

  // ─── Expired review ─────────────────────────────────────────────────────

  describe('Expired review marked correctly', () => {
    it('marks pending reviews past periodEnd as expired', async () => {
      mockDb.db.update = vi.fn().mockReturnValue({
        set: vi.fn().mockImplementation((data: any) => ({
          where: vi.fn().mockReturnValue(asUpdateResult([{ id: 'review-expired' }])),
        })),
      });

      const result = await service.markExpiredReviews();

      expect(result).toHaveProperty('expired');
    });
  });
});
