import { afterEach, describe, expect, it, vi } from 'vitest';
import { forceChangePassword, getActiveSessions, getAuditLog, resetPassword } from './api';

describe('auth api contract helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends reset-password payload aligned with backend validation schema', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ message: 'ok' }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await resetPassword('recovery-token', 'NewPassword1', 'NewPassword1');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/password/recovery/reset'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          token: 'recovery-token',
          newPassword: 'NewPassword1',
          confirmPassword: 'NewPassword1',
        }),
      }),
    );
  });

  it('sends forced-change payload aligned with backend validation schema', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ message: 'ok' }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await forceChangePassword('NewPassword1', 'NewPassword1');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/password/force-change'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          newPassword: 'NewPassword1',
          confirmPassword: 'NewPassword1',
        }),
      }),
    );
  });

  it('normalizes bare list responses from legacy admin pagination endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'session-1',
            userId: 'user-1',
            userEmail: 'admin@clinic.test',
            userName: 'Admin User',
            ipAddress: '127.0.0.1',
            userAgent: 'Chrome',
            lastActivity: '2026-03-30T10:00:00.000Z',
            createdAt: '2026-03-30T09:00:00.000Z',
          },
        ],
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await expect(getActiveSessions(1, 20)).resolves.toEqual({
      data: [
        expect.objectContaining({
          id: 'session-1',
          userId: 'user-1',
        }),
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });
  });

  it('normalizes meta-based pagination responses from audit endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'audit-1',
            timestamp: '2026-03-30T10:00:00.000Z',
            event: 'auth.login',
            actorId: 'user-1',
            actorEmail: 'admin@clinic.test',
            ipAddress: '127.0.0.1',
            metadata: {},
          },
        ],
        meta: {
          page: 2,
          pageSize: 10,
          total: 21,
          totalPages: 3,
        },
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await expect(getAuditLog({ page: 2, pageSize: 10 })).resolves.toEqual({
      data: [expect.objectContaining({ id: 'audit-1' })],
      total: 21,
      page: 2,
      pageSize: 10,
      totalPages: 3,
    });
  });
});
