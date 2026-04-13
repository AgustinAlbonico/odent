import type { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Action, Module, Scope } from '@sistema-odontologico/permissions';
import { AuditEventType } from '@sistema-odontologico/audit-core';
import { AccountAdminController } from '../../src/modules/auth/password/account-admin.controller.js';
import { AuthGuard } from '../../src/common/guards/auth.guard.js';
import { PasswordService } from '../../src/modules/auth/password/password.service.js';
import { PermissionsService } from '../../src/modules/permissions/permissions.service.js';
import { SessionPolicyRuntimeService } from '../../src/modules/session-policy/session-policy-runtime.service.js';
import { DatabaseService } from '../../src/infra/database/database.service.js';
import { auditEvents, userPermissions, users } from '../../src/infra/database/schema.js';

function createDbService() {
  let permissionRows = [
    {
      id: 'perm-0',
      userId: 'admin-1',
      module: Module.USERS_ROLES_PERMISSIONS,
      action: Action.VIEW_MODULE,
      scope: Scope.INSTITUTIONAL_TOTAL,
    },
    {
      id: 'perm-1',
      userId: 'admin-1',
      module: Module.USERS_ROLES_PERMISSIONS,
      action: Action.ADMIN_USERS,
      scope: Scope.INSTITUTIONAL_TOTAL,
    },
  ];
  let userRows = [
    {
      id: 'user-1',
      email: 'locked@test.com',
      passwordHash: 'hash',
      firstName: 'User',
      lastName: 'Locked',
      role: 'recepcionista',
      state: 'locked',
      tokenVersion: 0,
      mustChangePassword: false,
      failedLoginAttempts: 5,
      lockedUntil: new Date('2026-03-30T12:00:00.000Z'),
    },
  ];
  const auditLog: Array<Record<string, unknown>> = [];

  return {
    db: {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation((table: unknown) => {
          if (table === userPermissions) {
            return {
              where: vi.fn().mockResolvedValue(permissionRows),
            };
          }

          if (table === users) {
            return {
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(userRows),
              }),
            };
          }

          return {
            where: vi.fn().mockResolvedValue([]),
          };
        }),
      })),
      update: vi.fn().mockImplementation((table: unknown) => ({
        set: vi.fn().mockImplementation((payload: Record<string, unknown>) => ({
          where: vi.fn().mockImplementation(() => {
            if (table === users) {
              userRows = userRows.map((user) => ({
                ...user,
                ...payload,
              }));
            }
            return Promise.resolve();
          }),
        })),
      })),
      insert: vi.fn().mockImplementation((table: unknown) => ({
        values: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
          if (table === auditEvents) {
            auditLog.push(payload);
          }
          return Promise.resolve();
        }),
      })),
    },
    reset() {
      userRows = [
        {
          id: 'user-1',
          email: 'locked@test.com',
          passwordHash: 'hash',
          firstName: 'User',
          lastName: 'Locked',
          role: 'recepcionista',
          state: 'locked',
          tokenVersion: 0,
          mustChangePassword: false,
          failedLoginAttempts: 5,
          lockedUntil: new Date('2026-03-30T12:00:00.000Z'),
        },
      ];
      auditLog.length = 0;
    },
    getUsers() {
      return userRows;
    },
    getAuditLog() {
      return auditLog;
    },
  };
}

describe('Administrative account rehabilitation', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let dbService: ReturnType<typeof createDbService>;

  beforeAll(async () => {
    dbService = createDbService();

    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-auth-secret' })],
      controllers: [AccountAdminController],
      providers: [
        {
          provide: DatabaseService,
          useValue: dbService,
        },
        {
          provide: PermissionsService,
          useFactory: () => new PermissionsService(dbService as never),
        },
        {
          provide: SessionPolicyRuntimeService,
          useValue: {
            validateAccessSession: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PasswordService,
          useFactory: () => new PasswordService(dbService as never, { clearFailedAttempts: vi.fn() } as never),
        },
        AuthGuard,
        {
          provide: APP_GUARD,
          useExisting: AuthGuard,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    jwtService = moduleRef.get(JwtService);
  });

  beforeEach(() => {
    dbService.reset();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rehabilitates a locked account through an authorized administrative action', async () => {
    const token = jwtService.sign({
      sub: 'admin-1',
      email: 'admin@test.com',
      tid: 'tenant-1',
      schema: 'tenant_tenant_1',
      role: 'superadmin',
      tokenVersion: 0,
      mustChangePassword: false,
      sid: 'session-admin-1',
    });

    await request(app.getHttpServer())
      .patch('/admin/users/user-1/rehabilitate')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(dbService.getUsers()[0]).toMatchObject({
      state: 'active',
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    expect(dbService.getAuditLog()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: AuditEventType.ACCOUNT_UNLOCKED }),
        expect.objectContaining({ eventType: AuditEventType.ACCOUNT_REHABILITATED }),
      ]),
    );
  });
});
