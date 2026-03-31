import 'reflect-metadata';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AuditEventType } from '@sistema-odontologico/audit-core';
import { Action, Module } from '@sistema-odontologico/permissions';
import { PERMISSION_KEY } from '../../src/common/decorators/permissions.decorator.js';
import { auditEvents, sessionPolicies } from '../../src/infra/database/schema.js';
import {
  DEFAULT_SESSION_POLICY,
  SessionPolicyService,
} from '../../src/modules/session-policy/session-policy.service.js';
import { SessionPolicyController } from '../../src/modules/session-policy/session-policy.controller.js';

function createSelectChain(result: unknown) {
  return {
    from: vi.fn().mockReturnValue({
      orderBy: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

describe('Session policy runtime contracts', () => {
  it('requires SYSTEM_CONFIG.ADMIN_POLICIES on both admin session policy endpoints', () => {
    const getMetadata = Reflect.getMetadata(
      PERMISSION_KEY,
      SessionPolicyController.prototype.getPolicy,
    );
    const updateMetadata = Reflect.getMetadata(
      PERMISSION_KEY,
      SessionPolicyController.prototype.updatePolicy,
    );

    expect(getMetadata).toEqual({
      module: Module.SYSTEM_CONFIG,
      action: Action.ADMIN_POLICIES,
    });
    expect(updateMetadata).toEqual({
      module: Module.SYSTEM_CONFIG,
      action: Action.ADMIN_POLICIES,
    });
  });

  it('creates and returns a coherent default policy when no row exists yet', async () => {
    const insertedPolicy = {
      ...DEFAULT_SESSION_POLICY,
      updatedBy: 'admin-user',
      updatedAt: new Date('2026-03-30T12:00:00.000Z'),
    };

    const dbService = {
      db: {
        select: vi.fn().mockReturnValueOnce(createSelectChain([])),
        insert: vi.fn().mockImplementation((table: unknown) => {
          expect(table).toBe(sessionPolicies);
          return {
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([insertedPolicy]),
            }),
          };
        }),
      },
    };

    const service = new SessionPolicyService(dbService as never);

    await expect(service.getPolicy('admin-user')).resolves.toEqual(DEFAULT_SESSION_POLICY);
  });

  it('persists the canonical policy payload and records an audit event on update', async () => {
    const existingPolicy = {
      id: 'policy-1',
      ...DEFAULT_SESSION_POLICY,
      updatedBy: 'seed-user',
      updatedAt: new Date('2026-03-29T12:00:00.000Z'),
    };

    const updatedPolicy = {
      ...existingPolicy,
      inactivityTimeoutMinutes: 45,
      maxSessionDurationHours: 10,
      maxConcurrentSessions: 2,
      updatedBy: 'admin-user',
      updatedAt: new Date('2026-03-30T12:00:00.000Z'),
    };

    const insertValues = vi.fn().mockResolvedValue(undefined);

    const dbService = {
      db: {
        select: vi.fn().mockReturnValueOnce(createSelectChain([existingPolicy])),
        update: vi.fn().mockImplementation((table: unknown) => {
          expect(table).toBe(sessionPolicies);
          return {
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([updatedPolicy]),
              }),
            }),
          };
        }),
        insert: vi.fn().mockImplementation((table: unknown) => {
          expect(table).toBe(auditEvents);
          return { values: insertValues };
        }),
      },
    };

    const service = new SessionPolicyService(dbService as never);

    await expect(
      service.updatePolicy(
        {
          inactivityTimeoutMinutes: 45,
          maxSessionDurationHours: 10,
          maxConcurrentSessions: 2,
        },
        {
          userId: 'admin-user',
          userEmail: 'admin@clinic.test',
          ipAddress: '127.0.0.1',
          userAgent: 'Vitest',
        },
      ),
    ).resolves.toEqual({
      inactivityTimeoutMinutes: 45,
      maxSessionDurationHours: 10,
      maxConcurrentSessions: 2,
    });

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: AuditEventType.SESSION_POLICY_UPDATED,
        actorId: 'admin-user',
        actorEmail: 'admin@clinic.test',
      }),
    );
  });

  it('rejects drifted aliases and missing authenticated users at the controller boundary', async () => {
    const controller = new SessionPolicyController({
      getPolicy: vi.fn(),
      updatePolicy: vi.fn(),
    } as never);

    await expect(controller.getPolicy({} as never)).rejects.toBeInstanceOf(UnauthorizedException);

    await expect(
      controller.updatePolicy(
        {
          inactivityTimeoutMinutes: 30,
          maxDurationHours: 8,
          maxConcurrentSessions: 3,
        },
        {
          user: { sub: 'admin-user', email: 'admin@clinic.test' },
          ip: '127.0.0.1',
          get: vi.fn().mockReturnValue('Vitest'),
        } as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
