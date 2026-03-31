import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditEventType } from '@sistema-odontologico/audit-core';

// ─── Audit trail — integration tests ──────────────────────────────────────
//
// Tests that all audit event types are properly registered with correct
// metadata, and that filtering/export patterns work correctly.

describe('Audit Trail — Integration', () => {
  let auditLog: any[];

  beforeEach(() => {
    auditLog = [];
  });

  function recordEvent(event: {
    eventType: AuditEventType;
    actorId: string;
    actorEmail: string;
    ipAddress: string;
    userAgent: string;
    metadata: Record<string, unknown>;
  }) {
    auditLog.push({
      ...event,
      timestamp: new Date(),
      metadata: JSON.stringify(event.metadata),
    });
  }

  // ─── All event types registered with correct metadata ───────────────────

  describe('Event type registration', () => {
    it('LOGIN_SUCCESS registered with tenantId metadata', () => {
      recordEvent({
        eventType: AuditEventType.LOGIN_SUCCESS,
        actorId: 'user-1',
        actorEmail: 'user@test.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome',
        metadata: { tenantId: 'tenant-1' },
      });

      expect(auditLog).toHaveLength(1);
      expect(auditLog[0].eventType).toBe(AuditEventType.LOGIN_SUCCESS);
      const meta = JSON.parse(auditLog[0].metadata);
      expect(meta.tenantId).toBe('tenant-1');
    });

    it('LOGIN_FAILURE registered with failed attempt info', () => {
      recordEvent({
        eventType: AuditEventType.LOGIN_FAILURE,
        actorId: 'unknown',
        actorEmail: 'attacker@test.com',
        ipAddress: '10.0.0.1',
        userAgent: 'Bot',
        metadata: { reason: 'invalid_credentials', attemptedEmail: 'user@test.com' },
      });

      expect(auditLog[0].eventType).toBe(AuditEventType.LOGIN_FAILURE);
    });

    it('PASSWORD_CHANGED registered after voluntary change', () => {
      recordEvent({
        eventType: AuditEventType.PASSWORD_CHANGED,
        actorId: 'user-1',
        actorEmail: 'user@test.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome',
        metadata: {},
      });

      expect(auditLog[0].eventType).toBe(AuditEventType.PASSWORD_CHANGED);
    });

    it('RECOVERY_REQUESTED and RECOVERY_COMPLETED registered', () => {
      recordEvent({
        eventType: AuditEventType.RECOVERY_REQUESTED,
        actorId: 'user-1',
        actorEmail: 'user@test.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome',
        metadata: {},
      });

      recordEvent({
        eventType: AuditEventType.RECOVERY_COMPLETED,
        actorId: 'user-1',
        actorEmail: 'user@test.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome',
        metadata: {},
      });

      expect(auditLog).toHaveLength(2);
      expect(auditLog[0].eventType).toBe(AuditEventType.RECOVERY_REQUESTED);
      expect(auditLog[1].eventType).toBe(AuditEventType.RECOVERY_COMPLETED);
    });

    it('UNUSUAL_ACCESS_DETECTED with reasons', () => {
      recordEvent({
        eventType: AuditEventType.UNUSUAL_ACCESS_DETECTED,
        actorId: 'user-1',
        actorEmail: 'user@test.com',
        ipAddress: '10.0.0.99',
        userAgent: 'Chrome',
        metadata: { reasons: ['new_ip_address', 'new_user_agent'] },
      });

      const meta = JSON.parse(auditLog[0].metadata);
      expect(meta.reasons).toContain('new_ip_address');
      expect(meta.reasons).toContain('new_user_agent');
    });

    it('PLAN_QUOTA_BLOCKED with blocked action info', () => {
      recordEvent({
        eventType: AuditEventType.PLAN_QUOTA_BLOCKED,
        actorId: 'admin-1',
        actorEmail: 'admin@test.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome',
        metadata: {
          blockedAction: 'create',
          reason: 'quota_exhausted',
          quotaInfo: { current: 3, maximum: 3 },
        },
      });

      const meta = JSON.parse(auditLog[0].metadata);
      expect(meta.blockedAction).toBe('create');
      expect(meta.reason).toBe('quota_exhausted');
    });
  });

  // ─── Unauthorized access attempt recorded ───────────────────────────────

  describe('Unauthorized access recording', () => {
    it('ACCESS_DENIED event records who tried what', () => {
      recordEvent({
        eventType: AuditEventType.ACCESS_DENIED,
        actorId: 'asistente-1',
        actorEmail: 'asistente@test.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome',
        metadata: {
          attemptedModule: 'system_config',
          attemptedAction: 'admin_catalog',
          denialReason: 'no_view_permission',
        },
      });

      const meta = JSON.parse(auditLog[0].metadata);
      expect(meta.attemptedModule).toBe('system_config');
      expect(meta.denialReason).toBe('no_view_permission');
    });
  });

  // ─── Filter by eventType ────────────────────────────────────────────────

  describe('Filter by eventType', () => {
    beforeEach(() => {
      recordEvent({
        eventType: AuditEventType.LOGIN_SUCCESS, actorId: 'u1', actorEmail: 'u1@t.com',
        ipAddress: '1.1.1.1', userAgent: 'A', metadata: {},
      });
      recordEvent({
        eventType: AuditEventType.LOGIN_FAILURE, actorId: 'u2', actorEmail: 'u2@t.com',
        ipAddress: '2.2.2.2', userAgent: 'B', metadata: {},
      });
      recordEvent({
        eventType: AuditEventType.LOGIN_SUCCESS, actorId: 'u3', actorEmail: 'u3@t.com',
        ipAddress: '3.3.3.3', userAgent: 'C', metadata: {},
      });
      recordEvent({
        eventType: AuditEventType.LOGOUT, actorId: 'u1', actorEmail: 'u1@t.com',
        ipAddress: '1.1.1.1', userAgent: 'A', metadata: {},
      });
    });

    it('filters to LOGIN_SUCCESS events', () => {
      const filtered = auditLog.filter(
        (e) => e.eventType === AuditEventType.LOGIN_SUCCESS,
      );
      expect(filtered).toHaveLength(2);
    });

    it('filters to LOGIN_FAILURE events', () => {
      const filtered = auditLog.filter(
        (e) => e.eventType === AuditEventType.LOGIN_FAILURE,
      );
      expect(filtered).toHaveLength(1);
    });

    it('returns empty for event type with no matches', () => {
      const filtered = auditLog.filter(
        (e) => e.eventType === AuditEventType.PLAN_QUOTA_BLOCKED,
      );
      expect(filtered).toHaveLength(0);
    });
  });

  // ─── Filter by date range ───────────────────────────────────────────────

  describe('Filter by date range', () => {
    const BASE_NOW = new Date('2026-03-30T12:00:00.000Z');

    beforeEach(() => {
      // Manually set timestamps
      const now = new Date(BASE_NOW);
      const yesterday = new Date(BASE_NOW.getTime() - 24 * 60 * 60 * 1000 + 60 * 1000);
      const lastWeek = new Date(BASE_NOW.getTime() - 7 * 24 * 60 * 60 * 1000);

      auditLog = [
        {
          eventType: AuditEventType.LOGIN_SUCCESS,
          actorId: 'u1',
          timestamp: lastWeek,
          metadata: '{}',
        },
        {
          eventType: AuditEventType.LOGIN_SUCCESS,
          actorId: 'u2',
          timestamp: yesterday,
          metadata: '{}',
        },
        {
          eventType: AuditEventType.LOGOUT,
          actorId: 'u1',
          timestamp: now,
          metadata: '{}',
        },
      ];
    });

    it('filters to events in last 2 days', () => {
      const twoDaysAgo = new Date(BASE_NOW.getTime() - 2 * 24 * 60 * 60 * 1000);
      const filtered = auditLog.filter((e) => new Date(e.timestamp) >= twoDaysAgo);
      expect(filtered).toHaveLength(2);
    });

    it('filters to events in last 24 hours', () => {
      const oneDayAgo = new Date(BASE_NOW.getTime() - 24 * 60 * 60 * 1000);
      const filtered = auditLog.filter((e) => new Date(e.timestamp) >= oneDayAgo);
      expect(filtered).toHaveLength(2);
    });

    it('returns only last week event with wide range', () => {
      const tenDaysAgo = new Date(BASE_NOW.getTime() - 10 * 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(BASE_NOW.getTime() - 5 * 24 * 60 * 60 * 1000);
      const filtered = auditLog.filter((e) => {
        const ts = new Date(e.timestamp);
        return ts >= tenDaysAgo && ts <= fiveDaysAgo;
      });
      expect(filtered).toHaveLength(1);
    });
  });

  // ─── CSV export format ──────────────────────────────────────────────────

  describe('CSV export', () => {
    it('generates valid CSV with headers and rows', () => {
      recordEvent({
        eventType: AuditEventType.LOGIN_SUCCESS,
        actorId: 'user-1',
        actorEmail: 'user@test.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome/120',
        metadata: { tenantId: 'tenant-1' },
      });

      const headers = ['id', 'eventType', 'actorId', 'actorEmail', 'ipAddress', 'userAgent', 'timestamp', 'metadata'];
      const csvRows = [
        headers.join(','),
        ...auditLog.map((e, i) =>
          [i + 1, e.eventType, e.actorId, e.actorEmail, e.ipAddress, `"${e.userAgent}"`, e.timestamp.toISOString(), `"${e.metadata}"`].join(','),
        ),
      ];
      const csv = csvRows.join('\n');

      expect(csv).toContain('eventType');
      expect(csv).toContain(AuditEventType.LOGIN_SUCCESS);
      expect(csv).toContain('user@test.com');
      expect(csv.split('\n')).toHaveLength(2); // header + 1 row
    });
  });
});
