import 'reflect-metadata';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Action, Module } from '@sistema-odontologico/permissions';
import { PERMISSION_KEY } from '../../src/common/decorators/permissions.decorator.js';
import {
  PLAN_RESTRICTION_KEY,
  PlanRestrictionGuard,
} from '../../src/common/guards/plan-restriction.guard.js';
import { tenants, users } from '../../src/infra/database/schema.js';
import { ProfessionalsController } from '../../src/modules/professionals/professionals.controller.js';
import { ProfessionalsService } from '../../src/modules/professionals/professionals.service.js';

function createFakeProfessionalsDb(options?: {
  tenantCount?: number;
  professionals?: Array<Record<string, any>>;
}) {
  const tenant = {
    id: 'tenant-1',
    schema: 'tenant_1',
    name: 'Clinic Test',
    plan: 'basic',
    maxActiveProfessionals: 3,
    activeProfessionalCount: options?.tenantCount ?? 0,
    gracePeriodEnd: null,
    updatedAt: new Date('2026-03-30T12:00:00.000Z'),
  };

  const professionals = [...(options?.professionals ?? [])];

  return {
    tenant,
    professionals,
    db: {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation((table: unknown) => {
          if (table === tenants) {
            return {
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([tenant]),
              }),
            };
          }

          if (table === users) {
            return {
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockImplementation(async () => professionals.slice(0, 1)),
              }),
            };
          }

          throw new Error('Unexpected select table');
        }),
      })),
      insert: vi.fn().mockImplementation((table: unknown) => {
        if (table !== users) {
          throw new Error('Unexpected insert table');
        }

        return {
          values: vi.fn().mockImplementation((payload: Record<string, any>) => ({
            returning: vi.fn().mockImplementation(async () => {
              const created = {
                id: 'professional-created',
                tokenVersion: 0,
                failedLoginAttempts: 0,
                lastLoginAt: null,
                lockedUntil: null,
                createdAt: new Date('2026-03-30T12:00:00.000Z'),
                updatedAt: new Date('2026-03-30T12:00:00.000Z'),
                ...payload,
              };

              professionals.unshift(created);
              return [created];
            }),
          })),
        };
      }),
      update: vi.fn().mockImplementation((table: unknown) => {
        if (table === users) {
          return {
            set: vi.fn().mockImplementation((payload: Record<string, any>) => ({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockImplementation(async () => {
                  const current = professionals[0];
                  const updated = { ...current, ...payload };
                  professionals[0] = updated;
                  return [updated];
                }),
              }),
            })),
          };
        }

        if (table === tenants) {
          return {
            set: vi.fn().mockImplementation((payload: { activeProfessionalCount: number; updatedAt: Date }) => ({
              where: vi.fn().mockImplementation(async () => {
                tenant.activeProfessionalCount = payload.activeProfessionalCount;
                tenant.updatedAt = payload.updatedAt;
              }),
            })),
          };
        }

        throw new Error('Unexpected update table');
      }),
    },
  };
}

describe('Professionals runtime contracts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('wires plan restriction metadata on create/activate/reactivate routes', () => {
    expect(
      Reflect.getMetadata(
        PLAN_RESTRICTION_KEY,
        ProfessionalsController.prototype.createProfessional,
      ),
    ).toBe('create');
    expect(
      Reflect.getMetadata(
        PLAN_RESTRICTION_KEY,
        ProfessionalsController.prototype.activateProfessional,
      ),
    ).toBe('activate');
    expect(
      Reflect.getMetadata(
        PLAN_RESTRICTION_KEY,
        ProfessionalsController.prototype.reactivateProfessional,
      ),
    ).toBe('reactivate');
  });

  it('keeps RBAC metadata separate from plan restriction metadata', () => {
    expect(
      Reflect.getMetadata(
        PERMISSION_KEY,
        ProfessionalsController.prototype.createProfessional,
      ),
    ).toEqual({
      module: Module.PROFESSIONALS,
      action: Action.CREATE,
      scope: undefined,
    });

    expect(
      Reflect.getMetadata(
        PERMISSION_KEY,
        ProfessionalsController.prototype.activateProfessional,
      ),
    ).toEqual({
      module: Module.PROFESSIONALS,
      action: Action.CHANGE_STATUS,
      scope: undefined,
    });
  });

  it('creates a real professional through the controller instead of returning an accepted envelope', async () => {
    const createProfessional = vi.fn().mockResolvedValue({
      id: 'professional-1',
      email: 'ana@clinic.test',
      firstName: 'Ana',
      lastName: 'Pérez',
      role: 'profesional',
      state: 'active',
    });

    const controller = new ProfessionalsController({
      createProfessional,
      activateProfessional: vi.fn(),
      reactivateProfessional: vi.fn(),
    } as never);

    const result = await controller.createProfessional(
      {
        user: { sub: 'admin-1', tid: 'tenant-1' },
      } as never,
      {
        firstName: 'Ana',
        lastName: 'Pérez',
        email: 'ana@clinic.test',
      },
    );

    expect(result).toEqual({
      professional: {
        id: 'professional-1',
        email: 'ana@clinic.test',
        firstName: 'Ana',
        lastName: 'Pérez',
        role: 'profesional',
        state: 'active',
      },
    });
    expect(createProfessional).toHaveBeenCalledWith('tenant-1', {
      firstName: 'Ana',
      lastName: 'Pérez',
      email: 'ana@clinic.test',
    });
  });

  it('rejects missing authenticated users at the controller boundary', async () => {
    const controller = new ProfessionalsController({
      createProfessional: vi.fn(),
      activateProfessional: vi.fn(),
      reactivateProfessional: vi.fn(),
    } as never);

    await expect(
      controller.activateProfessional({ params: { professionalId: 'professional-1' } } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('persists a real professional row and increments tenant active quota on create', async () => {
    vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-temporary-secret' as never);

    const fakeDb = createFakeProfessionalsDb({ tenantCount: 1 });
    const service = new ProfessionalsService(fakeDb as never, { checkProfessionalQuota: vi.fn() } as never);

    const created = await service.createProfessional('tenant-1', {
      firstName: 'Ana',
      lastName: 'Pérez',
      email: 'ana@clinic.test',
    });

    expect(created).toEqual({
      id: 'professional-created',
      email: 'ana@clinic.test',
      firstName: 'Ana',
      lastName: 'Pérez',
      role: 'profesional',
      state: 'active',
    });
    expect(fakeDb.tenant.activeProfessionalCount).toBe(2);
    expect(fakeDb.professionals[0]).toMatchObject({
      email: 'ana@clinic.test',
      firstName: 'Ana',
      lastName: 'Pérez',
      role: 'profesional',
      state: 'active',
      mustChangePassword: true,
      passwordHash: 'hashed-temporary-secret',
    });
  });

  it('activates an existing inactive professional and increments tenant active quota', async () => {
    const fakeDb = createFakeProfessionalsDb({
      tenantCount: 1,
      professionals: [
        {
          id: 'professional-1',
          email: 'ana@clinic.test',
          firstName: 'Ana',
          lastName: 'Pérez',
          role: 'profesional',
          state: 'inactive',
        },
      ],
    });
    const service = new ProfessionalsService(fakeDb as never, { checkProfessionalQuota: vi.fn() } as never);

    const activated = await service.activateProfessional('tenant-1', 'professional-1');

    expect(activated).toEqual({
      id: 'professional-1',
      email: 'ana@clinic.test',
      firstName: 'Ana',
      lastName: 'Pérez',
      role: 'profesional',
      state: 'active',
    });
    expect(fakeDb.tenant.activeProfessionalCount).toBe(2);
    expect(fakeDb.professionals[0]?.state).toBe('active');
  });

  it('reactivates a disabled professional and increments tenant active quota', async () => {
    const fakeDb = createFakeProfessionalsDb({
      tenantCount: 0,
      professionals: [
        {
          id: 'professional-2',
          email: 'bea@clinic.test',
          firstName: 'Bea',
          lastName: 'Luna',
          role: 'profesional',
          state: 'locked',
        },
      ],
    });
    const service = new ProfessionalsService(fakeDb as never, { checkProfessionalQuota: vi.fn() } as never);

    const reactivated = await service.reactivateProfessional('tenant-1', 'professional-2');

    expect(reactivated).toEqual({
      id: 'professional-2',
      email: 'bea@clinic.test',
      firstName: 'Bea',
      lastName: 'Luna',
      role: 'profesional',
      state: 'active',
    });
    expect(fakeDb.tenant.activeProfessionalCount).toBe(1);
    expect(fakeDb.professionals[0]?.state).toBe('active');
  });

  it('rejects duplicate professional emails on create', async () => {
    const fakeDb = createFakeProfessionalsDb({
      professionals: [
        {
          id: 'professional-1',
          email: 'ana@clinic.test',
          firstName: 'Ana',
          lastName: 'Pérez',
          role: 'profesional',
          state: 'active',
        },
      ],
    });
    const service = new ProfessionalsService(fakeDb as never, { checkProfessionalQuota: vi.fn() } as never);

    await expect(
      service.createProfessional('tenant-1', {
        firstName: 'Ana',
        lastName: 'Pérez',
        email: 'ana@clinic.test',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns clear quota/grace reason when plan restriction blocks the action', async () => {
    const guard = new PlanRestrictionGuard(
      {
        canCreateProfessional: vi.fn().mockResolvedValue({
          allowed: false,
          reason: 'grace_expired_over_quota',
          quotaInfo: {
            current: 5,
            maximum: 3,
            remaining: 0,
          },
        }),
      } as never,
      {
        db: {
          insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
        },
      } as never,
      {
        getAllAndOverride: vi.fn().mockReturnValue('create'),
      } as never,
    );

    const request = {
      user: { sub: 'admin-1', email: 'admin@clinic.test', tid: 'tenant-1' },
      ip: '127.0.0.1',
      get: vi.fn().mockReturnValue('Vitest'),
    };

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: vi.fn(),
      getClass: vi.fn(),
    };

    await expect(guard.canActivate(context as never)).rejects.toMatchObject({
      response: {
        code: 'plan_quota_blocked',
        reason: 'grace_expired_over_quota',
        blockedAction: 'create',
        quotaInfo: {
          current: 5,
          maximum: 3,
          remaining: 0,
        },
      },
    });
  });
});
