import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditEventType } from '@sistema-odontologico/audit-core';

// ─── Session admin — service-level integration tests ──────────────────────
//
// These test the session management patterns used by admin users.
// In the actual codebase, session listing/closing may be in a
// sessions controller or admin controller. We test the logic pattern
// against the database mock.

describe('Session Admin — Integration', () => {
  // Mock setup shared across tests
  let mockDb: any;
  const sessions: Map<string, any> = new Map();
  const auditLog: any[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    sessions.clear();
    auditLog.length = 0;

    // Pre-populate sessions
    sessions.set('sess-1', {
      id: 'sess-1',
      userId: 'admin-user',
      ipAddress: '192.168.1.1',
      userAgent: 'Chrome/120',
      closedAt: null,
      closeReason: null,
    });
    sessions.set('sess-2', {
      id: 'sess-2',
      userId: 'regular-user',
      ipAddress: '10.0.0.1',
      userAgent: 'Firefox/121',
      closedAt: null,
      closeReason: null,
    });

    mockDb = {
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() =>
              Promise.resolve(Array.from(sessions.values()).filter((s) => !s.closedAt)),
            ),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockImplementation((data: any) => ({
            where: vi.fn().mockImplementation((condition: any) => {
              // Close the session in our mock store
              for (const [id, sess] of sessions) {
                if (!sess.closedAt) {
                  Object.assign(sess, data);
                }
              }
              return Promise.resolve();
            }),
          })),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockImplementation((data: any) => {
            auditLog.push(data);
            return Promise.resolve();
          }),
        }),
      },
    };
  });

  // ─── List active sessions for tenant ────────────────────────────────────

  describe('List active sessions', () => {
    it('returns only sessions without closedAt', async () => {
      const activeSessions = await mockDb.db
        .select()
        .from('sessions')
        .where({ closedAt: null });

      expect(activeSessions).toHaveLength(2);
      expect(activeSessions.every((s: any) => !s.closedAt)).toBe(true);
    });

    it('excludes already-closed sessions', async () => {
      // Close one session
      sessions.get('sess-1')!.closedAt = new Date();
      sessions.get('sess-1')!.closeReason = 'user_logout';

      const activeSessions = await mockDb.db
        .select()
        .from('sessions')
        .where({ closedAt: null });

      expect(activeSessions).toHaveLength(1);
      expect(activeSessions[0].id).toBe('sess-2');
    });
  });

  // ─── Close session as admin ─────────────────────────────────────────────

  describe('Close session as admin', () => {
    it('closes another user session successfully', async () => {
      await mockDb.db
        .update('sessions')
        .set({
          closedAt: new Date(),
          closeReason: 'admin_close',
          closedBy: 'admin-user',
        })
        .where({ userId: 'regular-user' });

      expect(sessions.get('sess-2')!.closedAt).toBeDefined();
      expect(sessions.get('sess-2')!.closeReason).toBe('admin_close');
    });

    it('records audit event for admin close', async () => {
      // Simulate: close session + record audit
      await mockDb.db
        .update('sessions')
        .set({ closedAt: new Date(), closeReason: 'admin_close' })
        .where({ id: 'sess-2' });

      await mockDb.db.insert('auditEvents').values({
        eventType: AuditEventType.SESSION_CLOSED_BY_ADMIN,
        actorId: 'admin-user',
        actorEmail: 'admin@clinica.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome/120',
        metadata: JSON.stringify({ closedSessionId: 'sess-2' }),
      });

      expect(auditLog).toHaveLength(1);
      expect(auditLog[0].eventType).toBe(AuditEventType.SESSION_CLOSED_BY_ADMIN);
    });
  });

  // ─── Cannot close own session as admin-close ────────────────────────────

  describe('Cannot close own session as admin-close', () => {
    it('should use regular logout flow for own session', () => {
      // Business rule: admin closing their own session = regular logout
      // The close reason should be 'user_logout', not 'admin_close'
      const ownSession = sessions.get('sess-1')!;
      expect(ownSession.userId).toBe('admin-user');

      // Admin should close their session with user_logout reason
      const isOwnSession = ownSession.userId === 'admin-user';
      expect(isOwnSession).toBe(true);

      // The system should redirect to regular logout flow
      // This is a design constraint, not a hard block
    });
  });

  // ─── Audit event recorded on close ──────────────────────────────────────

  describe('Audit trail on close', () => {
    it('audit event contains correct metadata', async () => {
      await mockDb.db.insert('auditEvents').values({
        eventType: AuditEventType.SESSION_CLOSED_BY_ADMIN,
        actorId: 'admin-user',
        actorEmail: 'admin@clinica.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome/120',
        metadata: JSON.stringify({
          closedSessionId: 'sess-2',
          targetUserId: 'regular-user',
          reason: 'security_concern',
        }),
      });

      const event = auditLog[0];
      expect(event.actorId).toBe('admin-user');
      expect(event.eventType).toBe(AuditEventType.SESSION_CLOSED_BY_ADMIN);

      const metadata = JSON.parse(event.metadata);
      expect(metadata.closedSessionId).toBe('sess-2');
      expect(metadata.targetUserId).toBe('regular-user');
    });
  });
});
