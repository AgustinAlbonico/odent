import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditController } from '../../src/modules/audit/audit.controller.js';

describe('AuditController', () => {
  const mockOrderBy = vi.fn();
  const mockLimit = vi.fn();
  const mockOffset = vi.fn();
  const mockWhere = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();

  let controller: AuditController;

  beforeEach(() => {
    vi.clearAllMocks();

    mockOffset.mockResolvedValue([
      {
        id: 'evt-1',
        actorId: 'user-self',
        actorEmail: 'self@test.com',
        eventType: 'login_success',
        ipAddress: '127.0.0.1',
        userAgent: 'Chrome',
        metadata: JSON.stringify({ tenantId: 'tenant-1' }),
        createdAt: new Date('2026-03-30T10:00:00.000Z'),
      },
    ]);

    mockLimit.mockReturnValue({ offset: mockOffset });
    mockOrderBy.mockReturnValue({ limit: mockLimit });
    mockWhere.mockReturnValue({ orderBy: mockOrderBy });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    controller = new AuditController({
      db: {
        select: mockSelect,
      },
    } as any);
  });

  it('returns only the authenticated user personal access history', async () => {
    const result = await controller.getPersonalHistory({ user: { sub: 'user-self' } } as any, '1', '20');

    expect(mockWhere).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual([
      expect.objectContaining({
        actorId: 'user-self',
        metadata: { tenantId: 'tenant-1' },
      }),
    ]);
    expect(result.meta).toEqual({ page: 1, pageSize: 20 });
  });
});
