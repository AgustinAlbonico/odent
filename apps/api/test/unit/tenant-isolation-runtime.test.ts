import { describe, expect, it, vi, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';
import {
  users,
  patientMutuals,
  mutuals,
  patients,
  whatsappBotSessions,
} from '../../src/infra/database/schema.js';
import { UsersService } from '../../src/modules/users/users.service.js';
import { PatientsService } from '../../src/modules/patients/patients.service.js';
import { BotStateMachine } from '../../src/modules/appointments/whatsapp/bot-statemachine.js';
import { BotState } from '../../src/modules/appointments/whatsapp/whatsapp.types.js';

function extractComparisons(
  node: unknown,
  results: Array<{ column: string; value: unknown }> = [],
) {
  if (!node || typeof node !== 'object') {
    return results;
  }

  const queryChunks = Array.isArray((node as { queryChunks?: unknown[] }).queryChunks)
    ? ((node as { queryChunks: unknown[] }).queryChunks ?? [])
    : [];

  for (let index = 0; index < queryChunks.length; index += 1) {
    const maybeColumn = queryChunks[index + 1] as { name?: unknown } | undefined;
    const maybeParam = queryChunks[index + 3] as { value?: unknown } | undefined;

    if (
      maybeColumn &&
      typeof maybeColumn === 'object' &&
      'name' in maybeColumn &&
      maybeParam &&
      typeof maybeParam === 'object' &&
      'value' in maybeParam
    ) {
      results.push({
        column: String(maybeColumn.name),
        value: maybeParam.value,
      });
    }

    extractComparisons(queryChunks[index], results);
  }

  return results;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Tenant isolation runtime regressions', () => {
  it('persists the current tenant when creating users without changing global email uniqueness semantics', async () => {
    const insertedUser = {
      id: 'user-1',
      tenantId: 'tenant-1',
    };
    const insertValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([insertedUser]),
    });

    const dbService = {
      db: {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
        insert: vi.fn().mockImplementation((table: unknown) => {
          expect(table).toBe(users);
          return { values: insertValues };
        }),
      },
    };

    const service = new UsersService(dbService as never, {} as never);
    vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);
    vi.spyOn(service, 'getUserById').mockResolvedValue({
      id: 'user-1',
      email: 'recepcion@test.com',
      firstName: 'Recep',
      lastName: 'Uno',
      role: 'recepcionista',
      state: 'active',
      mustChangePassword: true,
      lastLoginAt: null,
      createdAt: new Date('2026-04-06T12:00:00.000Z'),
      tokenVersion: 0,
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date('2026-04-06T12:00:00.000Z'),
      customPermissions: [],
    });
    vi.spyOn(service as any, 'recordAudit').mockResolvedValue(undefined);

    await service.createUser(
      {
        email: ' Recepcion@Test.com ',
        firstName: ' Recep ',
        lastName: ' Uno ',
        role: 'recepcionista',
        state: 'active',
        mustChangePassword: true,
      },
      'tenant-1',
      { sub: 'admin-1', email: 'admin@test.com' },
      '127.0.0.1',
      'Vitest',
    );

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-1',
        email: 'recepcion@test.com',
      }),
    );
  });

  it('validates patient mutuals against both mutual id and tenant id', async () => {
    let mutualWhereClause: unknown;

    const dbService = {
      db: {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation((table: unknown) => {
            if (table === patients) {
              return {
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([{ id: 'patient-1' }]),
                }),
              };
            }

            if (table === mutuals) {
              return {
                where: vi.fn().mockImplementation((whereClause: unknown) => {
                  mutualWhereClause = whereClause;
                  return {
                    limit: vi
                      .fn()
                      .mockResolvedValue([
                        { id: 'mutual-1', name: 'OSDE', code: 'OSD', isActive: true },
                      ]),
                  };
                }),
              };
            }

            if (table === patientMutuals) {
              return {
                innerJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([
                      {
                        id: 'link-1',
                        patientId: 'patient-1',
                        mutualId: 'mutual-1',
                        mutualName: 'OSDE',
                        mutualCode: 'OSD',
                        planName: '210',
                        affiliateNumber: 'A-1',
                        coveragePercent: 80,
                        isActive: true,
                        createdAt: new Date('2026-04-06T12:00:00.000Z'),
                        updatedAt: new Date('2026-04-06T12:00:00.000Z'),
                      },
                    ]),
                  }),
                }),
              };
            }

            throw new Error('Unexpected table in select');
          }),
        })),
        insert: vi.fn().mockImplementation((table: unknown) => {
          expect(table).toBe(patientMutuals);
          return {
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 'link-1' }]),
            }),
          };
        }),
      },
    };

    const service = new PatientsService(dbService as never);

    await service.addPatientMutual(
      'patient-1',
      {
        mutualId: 'mutual-1',
        planName: '210',
        affiliateNumber: 'A-1',
        coveragePercent: 80,
        isActive: true,
      },
      'tenant-1',
    );

    expect(extractComparisons(mutualWhereClause)).toEqual(
      expect.arrayContaining([
        { column: 'id', value: 'mutual-1' },
        { column: 'tenant_id', value: 'tenant-1' },
      ]),
    );
  });

  it('filters WhatsApp patient lookup by phone and tenant', async () => {
    let patientWhereClause: unknown;

    const dbService = {
      db: {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation((table: unknown) => {
            if (table !== patients) {
              throw new Error('Unexpected table in patient lookup');
            }

            return {
              where: vi.fn().mockImplementation((whereClause: unknown) => {
                patientWhereClause = whereClause;
                return {
                  limit: vi.fn().mockResolvedValue([
                    {
                      id: 'patient-1',
                      firstName: 'Ana',
                      lastName: 'Pérez',
                      phone: '5491112345678',
                    },
                  ]),
                };
              }),
            };
          }),
        })),
      },
    };

    const service = new BotStateMachine(
      dbService as never,
      { sendText: vi.fn(), sendButtons: vi.fn() } as never,
      { findNextForPatient: vi.fn(), changeStatus: vi.fn() } as never,
      {} as never,
    );

    const patient = await (service as any).findPatientByPhone('5491112345678@c.us', 'tenant-1');

    expect(patient).toMatchObject({
      id: 'patient-1',
      tenantId: 'tenant-1',
    });
    expect(extractComparisons(patientWhereClause)).toEqual(
      expect.arrayContaining([
        { column: 'phone', value: '5491112345678' },
        { column: 'tenant_id', value: 'tenant-1' },
      ]),
    );
  });

  it('looks up existing WhatsApp sessions by phone and tenant before reusing them', async () => {
    let sessionWhereClause: unknown;

    const existingSession = {
      id: 'session-1',
      tenantId: 'tenant-1',
      phoneNumber: '5491112345678',
      patientId: 'patient-1',
      currentState: BotState.IDLE,
      contextData: {},
      lastInteractionAt: new Date('2026-04-06T12:00:00.000Z'),
      expiresAt: new Date('2026-04-06T12:30:00.000Z'),
    };

    const dbService = {
      db: {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation((table: unknown) => {
            if (table !== whatsappBotSessions) {
              throw new Error('Unexpected table in session lookup');
            }

            return {
              where: vi.fn().mockImplementation((whereClause: unknown) => {
                sessionWhereClause = whereClause;
                return {
                  limit: vi.fn().mockResolvedValue([existingSession]),
                };
              }),
            };
          }),
        })),
        insert: vi.fn(),
      },
    };

    const service = new BotStateMachine(
      dbService as never,
      { sendText: vi.fn(), sendButtons: vi.fn() } as never,
      { findNextForPatient: vi.fn(), changeStatus: vi.fn() } as never,
      {} as never,
    );

    const session = await (service as any).getOrCreateSession(
      '5491112345678',
      'tenant-1',
      'patient-1',
    );

    expect(session).toMatchObject(existingSession);
    expect(extractComparisons(sessionWhereClause)).toEqual(
      expect.arrayContaining([
        { column: 'phone_number', value: '5491112345678' },
        { column: 'tenant_id', value: 'tenant-1' },
      ]),
    );
    expect(dbService.db.insert).not.toHaveBeenCalled();
  });

  it('filters WhatsApp confirm flow session lookup by phone and tenant', async () => {
    let sessionWhereClause: unknown;

    const existingSession = {
      id: 'session-confirm',
      tenantId: 'tenant-1',
      phoneNumber: '5491112345678',
      patientId: 'patient-1',
      currentState: BotState.IDLE,
      contextData: {},
      lastInteractionAt: new Date('2026-04-06T12:00:00.000Z'),
      expiresAt: new Date('2026-04-06T12:30:00.000Z'),
    };

    const dbService = {
      db: {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation((table: unknown) => {
            if (table !== whatsappBotSessions) {
              throw new Error('Unexpected table in confirm flow lookup');
            }

            return {
              where: vi.fn().mockImplementation((whereClause: unknown) => {
                sessionWhereClause = whereClause;
                return {
                  limit: vi.fn().mockResolvedValue([existingSession]),
                };
              }),
            };
          }),
        })),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      },
    };

    const whatsappService = { sendText: vi.fn(), sendButtons: vi.fn() };
    const appointmentsService = {
      findNextForPatient: vi.fn().mockResolvedValue({
        id: 'appointment-1',
        professionalId: 'professional-1',
        professionalName: 'Dra. Pérez',
        startAt: new Date('2026-04-07T12:00:00.000Z'),
      }),
      changeStatus: vi.fn(),
    };

    const service = new BotStateMachine(
      dbService as never,
      whatsappService as never,
      appointmentsService as never,
      {} as never,
    );

    await (service as any).startConfirming('5491112345678', {
      id: 'patient-1',
      firstName: 'Ana',
      lastName: 'Pérez',
      phone: '5491112345678',
      tenantId: 'tenant-1',
    });

    expect(extractComparisons(sessionWhereClause)).toEqual(
      expect.arrayContaining([
        { column: 'phone_number', value: '5491112345678' },
        { column: 'tenant_id', value: 'tenant-1' },
      ]),
    );
  });

  it('filters WhatsApp cancel flow session lookup by phone and tenant', async () => {
    let sessionWhereClause: unknown;

    const existingSession = {
      id: 'session-cancel',
      tenantId: 'tenant-1',
      phoneNumber: '5491112345678',
      patientId: 'patient-1',
      currentState: BotState.CANCELLING,
      contextData: { appointmentId: 'appointment-1' },
      lastInteractionAt: new Date('2026-04-06T12:00:00.000Z'),
      expiresAt: new Date('2026-04-06T12:30:00.000Z'),
    };

    const dbService = {
      db: {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation((table: unknown) => {
            if (table !== whatsappBotSessions) {
              throw new Error('Unexpected table in cancel flow lookup');
            }

            return {
              where: vi.fn().mockImplementation((whereClause: unknown) => {
                sessionWhereClause = whereClause;
                return {
                  limit: vi.fn().mockResolvedValue([existingSession]),
                };
              }),
            };
          }),
        })),
      },
    };

    const service = new BotStateMachine(
      dbService as never,
      { sendText: vi.fn(), sendButtons: vi.fn() } as never,
      {
        findNextForPatient: vi.fn(),
        changeStatus: vi.fn().mockResolvedValue(undefined),
      } as never,
      {} as never,
    );
    vi.spyOn(service as any, 'resetToIdle').mockResolvedValue(undefined);

    await (service as any).cancelAppointment('5491112345678', 'appointment-1', {
      id: 'patient-1',
      firstName: 'Ana',
      lastName: 'Pérez',
      phone: '5491112345678',
      tenantId: 'tenant-1',
    });

    expect(extractComparisons(sessionWhereClause)).toEqual(
      expect.arrayContaining([
        { column: 'phone_number', value: '5491112345678' },
        { column: 'tenant_id', value: 'tenant-1' },
      ]),
    );
  });
});
