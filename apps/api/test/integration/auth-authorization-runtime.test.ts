import { Controller, Get, Patch, Post } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Action, BaseRole, DEFAULT_ROLE_PERMISSIONS, Module, Scope } from '@sistema-odontologico/permissions';
import { RequirePermission } from '../../src/common/decorators/index.js';
import { AuthGuard } from '../../src/common/guards/auth.guard.js';
import { AuditController } from '../../src/modules/audit/audit.controller.js';
import { PermissionsService } from '../../src/modules/permissions/permissions.service.js';
import { SessionPolicyRuntimeService } from '../../src/modules/session-policy/session-policy-runtime.service.js';
import { DatabaseService } from '../../src/infra/database/database.service.js';
import { auditEvents, userPermissions } from '../../src/infra/database/schema.js';
import { AuditEventType } from '@sistema-odontologico/audit-core';

type PermissionRow = {
  id: string;
  userId: string;
  module: Module;
  action: Action;
  scope: Scope;
};

@Controller('runtime-protected')
class RuntimeProtectedController {
  @Post('forbidden-action')
  @RequirePermission(Module.SYSTEM_CONFIG, Action.ADMIN_POLICIES)
  forbiddenAction() {
    return { ok: true };
  }

  @Patch('scope-insufficient')
  @RequirePermission(Module.PATIENTS, Action.EDIT, Scope.SUPERVISION)
  scopeInsufficient() {
    return { ok: true };
  }
}

function createDbService() {
  let permissionRows: PermissionRow[] = [];
  let auditRows: Array<Record<string, unknown>> = [];

  const orderedResult = (rows: Array<Record<string, unknown>>) => ({
    orderBy: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue(rows),
      offset: vi.fn().mockResolvedValue(rows),
    }),
  });

  return {
    db: {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation((table: unknown) => {
          if (table === userPermissions) {
            return {
              where: vi.fn().mockResolvedValue(permissionRows),
            };
          }

          if (table === auditEvents) {
            return {
              where: vi.fn().mockImplementation(() => orderedResult(auditRows)),
            };
          }

          return {
            where: vi.fn().mockResolvedValue([]),
          };
        }),
      })),
    },
    setPermissions(rows: PermissionRow[]) {
      permissionRows = rows;
    },
    setAuditRows(rows: Array<Record<string, unknown>>) {
      auditRows = rows;
    },
  };
}

describe('Auth guard runtime authorization proofs', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let dbService: ReturnType<typeof createDbService>;
  let permissionsService: PermissionsService;

  beforeAll(async () => {
    dbService = createDbService();

    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-auth-secret' })],
      controllers: [RuntimeProtectedController, AuditController],
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
    permissionsService = moduleRef.get(PermissionsService);
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    dbService.setPermissions([]);
    dbService.setAuditRows([]);
  });

  afterAll(async () => {
    await app?.close();
  });

  function signAccessToken(overrides: Partial<Record<string, unknown>> = {}) {
    return jwtService.sign({
      sub: 'user-1',
      email: 'user@test.com',
      tid: 'tenant-1',
      schema: 'tenant_tenant_1',
      role: 'superadmin',
      tokenVersion: 0,
      mustChangePassword: false,
      sid: 'session-1',
      ...overrides,
    });
  }

  it('returns scope_insufficient on a protected endpoint when scope is lower than required', async () => {
    dbService.setPermissions([
      {
        id: 'perm-0',
        userId: 'user-1',
        module: Module.PATIENTS,
        action: Action.VIEW_MODULE,
        scope: Scope.ASSIGNED,
      },
      {
        id: 'perm-1',
        userId: 'user-1',
        module: Module.PATIENTS,
        action: Action.EDIT,
        scope: Scope.ASSIGNED,
      },
    ]);

    const response = await request(app.getHttpServer())
      .patch('/runtime-protected/scope-insufficient')
      .set('Authorization', `Bearer ${signAccessToken()}`)
      .expect(403);

    expect(response.body.code).toBe('scope_insufficient');
  });

  it('returns no_operate_permission when user can view a module but cannot execute the protected action', async () => {
    dbService.setPermissions([
      {
        id: 'perm-1',
        userId: 'user-1',
        module: Module.SYSTEM_CONFIG,
        action: Action.VIEW_MODULE,
        scope: Scope.OPERATIONAL_INSTITUTIONAL,
      },
    ]);

    const response = await request(app.getHttpServer())
      .post('/runtime-protected/forbidden-action')
      .set('Authorization', `Bearer ${signAccessToken()}`)
      .expect(403);

    expect(response.body.code).toBe('no_operate_permission');
  });

  it('allows audit export when the user has authorized audit scope', async () => {
    dbService.setPermissions([]);
    dbService.setAuditRows([
      {
        id: 'audit-1',
        eventType: AuditEventType.LOGIN_SUCCESS,
        actorEmail: 'user@test.com',
        ipAddress: '127.0.0.1',
        createdAt: new Date('2026-03-30T10:00:00.000Z'),
        metadata: JSON.stringify({ tenantId: 'tenant-1' }),
      },
    ]);
    vi.spyOn(permissionsService, 'resolvePermissions').mockResolvedValue(
      DEFAULT_ROLE_PERMISSIONS[BaseRole.SUPERADMIN],
    );

    const response = await request(app.getHttpServer())
      .get('/admin/audit/export?eventType=login_success')
      .set('Authorization', `Bearer ${signAccessToken()}`);

    expect(response.status).toBe(200);

    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.text).toContain('event_type');
    expect(response.text).toContain(AuditEventType.LOGIN_SUCCESS);
  });

  it('exports only rows that belong to the authenticated tenant universe', async () => {
    dbService.setPermissions([]);
    dbService.setAuditRows([
      {
        id: 'audit-1',
        eventType: AuditEventType.LOGIN_SUCCESS,
        actorEmail: 'allowed@test.com',
        ipAddress: '127.0.0.1',
        createdAt: new Date('2026-03-30T10:00:00.000Z'),
        metadata: JSON.stringify({ tenantId: 'tenant-1' }),
      },
      {
        id: 'audit-2',
        eventType: AuditEventType.LOGIN_SUCCESS,
        actorEmail: 'foreign@test.com',
        ipAddress: '127.0.0.2',
        createdAt: new Date('2026-03-30T10:05:00.000Z'),
        metadata: JSON.stringify({ tenantId: 'tenant-2' }),
      },
    ]);
    vi.spyOn(permissionsService, 'resolvePermissions').mockResolvedValue(
      DEFAULT_ROLE_PERMISSIONS[BaseRole.SUPERADMIN],
    );

    const response = await request(app.getHttpServer())
      .get('/admin/audit/export?eventType=login_success')
      .set('Authorization', `Bearer ${signAccessToken({ tid: 'tenant-1' })}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain('allowed@test.com');
    expect(response.text).not.toContain('foreign@test.com');
  });
});
