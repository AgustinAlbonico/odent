import 'reflect-metadata';
import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AuditEventType } from '@sistema-odontologico/audit-core';
import { auditEvents, sessions } from '../../src/infra/database/schema.js';
import { DEFAULT_SESSION_POLICY } from '../../src/modules/session-policy/session-policy.service.js';
import { SessionPolicyRuntimeService } from '../../src/modules/session-policy/session-policy-runtime.service.js';

function createActiveSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-1',
    userId: 'user-1',
    refreshTokenHash: 'hashed-refresh-token',
    ipAddress: '127.0.0.1',
    userAgent: 'Vitest',
    expiresAt: new Date('2026-03-31T12:00:00.000Z'),
    lastActivityAt: new Date('2026-03-30T11:50:00.000Z'),
    closedAt: null,
    closedBy: null,
    closeReason: null,
    createdAt: new Date('2026-03-30T08:00:00.000Z'),
    ...overrides,
  };
}

function createSessionSelectChain(result: unknown) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

describe('Session policy runtime enforcement', () => {
  it('expires sessions that exceed inactivity timeout and records the reason', async () => {
    const now = new Date('2026-03-30T12:00:00.000Z');
    const expiredSession = createActiveSession({
      lastActivityAt: new Date('2026-03-30T11:20:00.000Z'),
    });

    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
    const insertValues = vi.fn().mockResolvedValue(undefined);

    const runtime = new SessionPolicyRuntimeService(
      {
        db: {
          select: vi.fn().mockReturnValue(createSessionSelectChain([expiredSession])),
          update: vi.fn().mockImplementation((table: unknown) => {
            expect(table).toBe(sessions);
            return { set: updateSet };
          }),
          insert: vi.fn().mockImplementation((table: unknown) => {
            expect(table).toBe(auditEvents);
            return { values: insertValues };
          }),
        },
      } as never,
      {
        getRuntimePolicy: vi.fn().mockResolvedValue(DEFAULT_SESSION_POLICY),
      } as never,
    );

    await expect(
      runtime.validateAccessSession(
        {
          sessionId: 'session-1',
          userId: 'user-1',
          userEmail: 'doctor@clinic.test',
          ipAddress: '127.0.0.1',
          userAgent: 'Vitest',
        },
        now,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        closeReason: 'inactivity_timeout',
        closedAt: now,
      }),
    );
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: AuditEventType.SESSION_EXPIRED,
        actorId: 'user-1',
      }),
    );
  });

  it('touches last activity for valid sessions so inactivity windows move forward', async () => {
    const now = new Date('2026-03-30T12:00:00.000Z');
    const activeSession = createActiveSession();

    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn().mockReturnValue({ where: updateWhere });

    const runtime = new SessionPolicyRuntimeService(
      {
        db: {
          select: vi.fn().mockReturnValue(createSessionSelectChain([activeSession])),
          update: vi.fn().mockImplementation((table: unknown) => {
            expect(table).toBe(sessions);
            return { set: updateSet };
          }),
          insert: vi.fn(),
        },
      } as never,
      {
        getRuntimePolicy: vi.fn().mockResolvedValue(DEFAULT_SESSION_POLICY),
      } as never,
    );

    await expect(
      runtime.validateAccessSession(
        {
          sessionId: 'session-1',
          userId: 'user-1',
          userEmail: 'doctor@clinic.test',
          ipAddress: '127.0.0.1',
          userAgent: 'Vitest',
        },
        now,
      ),
    ).resolves.toEqual(activeSession);

    expect(updateSet).toHaveBeenCalledWith({ lastActivityAt: now });
  });

  it('expires sessions that exceed max session duration before refresh can continue', async () => {
    const now = new Date('2026-03-30T12:00:00.000Z');
    const expiredSession = createActiveSession({
      createdAt: new Date('2026-03-30T03:00:00.000Z'),
      lastActivityAt: new Date('2026-03-30T11:59:00.000Z'),
    });

    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn().mockReturnValue({ where: updateWhere });

    const runtime = new SessionPolicyRuntimeService(
      {
        db: {
          select: vi.fn().mockReturnValue(createSessionSelectChain([expiredSession])),
          update: vi.fn().mockImplementation((table: unknown) => {
            expect(table).toBe(sessions);
            return { set: updateSet };
          }),
          insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
        },
      } as never,
      {
        getRuntimePolicy: vi.fn().mockResolvedValue({
          ...DEFAULT_SESSION_POLICY,
          maxSessionDurationHours: 8,
        }),
      } as never,
    );

    await expect(
      runtime.validateRefreshSession(
        {
          sessionId: 'session-1',
          userId: 'user-1',
          userEmail: 'doctor@clinic.test',
          ipAddress: '127.0.0.1',
          userAgent: 'Vitest',
        },
        now,
      ),
    ).resolves.toBeNull();

    expect(updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        closeReason: 'max_duration_reached',
        closedAt: now,
      }),
    );
  });
});
