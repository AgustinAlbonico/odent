import { type PermissionEntry } from '@sistema-odontologico/permissions';

/**
 * Typed API client for authentication endpoints.
 * All calls go through the backend API (apps/api).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? '';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  tenantId: string;
  mustChangePassword: boolean;
}

export type Ability = PermissionEntry;

export interface AbilitiesResponse {
  user: AuthUser;
  abilities: Ability[];
}

export interface LoginSuccessResponse {
  user: AuthUser;
  requiresPasswordChange?: false;
  landingPath?: string;
}

export interface LoginPasswordChangeRequiredResponse {
  user: AuthUser;
  requiresPasswordChange: true;
}

export type LoginResponse = LoginSuccessResponse | LoginPasswordChangeRequiredResponse;

interface LegacyPaginationMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Mutex to prevent multiple concurrent token refresh requests.
 * When several API calls get 401 at the same time, only the first
 * one triggers the actual refresh; the rest await the same promise.
 */
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  // Handle 401 with automatic token refresh
  if (
    res.status === 401
    && !path.includes('/api/auth/refresh')
    && !path.includes('/api/auth/login')
  ) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry the original request once with the new token
      const retryRes = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
      });
      if (retryRes.ok) {
        if (retryRes.status === 204) return undefined as T;
        return retryRes.json() as Promise<T>;
      }
      // Retry failed — fall through to error handling below
    }
    // Refresh failed — fall through to error handling below
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiError;
    throw new ApiClientError(res.status, body.message ?? res.statusText, body.error);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

function toPositiveNumber(value: unknown, fallback: number): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function normalizePaginatedResponse<T>(
  payload: unknown,
  fallbackPage: number,
  fallbackPageSize: number,
): PaginatedResponse<T> {
  const raw = (payload ?? {}) as {
    data?: T[];
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
    meta?: LegacyPaginationMeta;
  };

  const data = Array.isArray(raw.data) ? raw.data : [];
  const meta = raw.meta ?? {};
  const page = toPositiveNumber(meta.page ?? raw.page, fallbackPage);
  const pageSize = toPositiveNumber(meta.pageSize ?? raw.pageSize, fallbackPageSize);
  const total = toPositiveNumber(meta.total ?? raw.total, data.length || 1) - (data.length === 0 ? 1 : 0);
  const normalizedTotal = data.length === 0 ? 0 : total;
  const totalPages = toPositiveNumber(
    meta.totalPages ?? raw.totalPages,
    Math.max(1, Math.ceil(normalizedTotal / pageSize) || 1),
  );

  return {
    data,
    total: normalizedTotal,
    page,
    pageSize,
    totalPages,
  };
}

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/* ------------------------------------------------------------------ */
/* Auth API functions                                                  */
/* ------------------------------------------------------------------ */

/** Login with email and password. Sets httpOnly cookies server-side. */
export async function login(email: string, password: string): Promise<LoginResponse> {
  if (!TENANT_ID) {
    throw new ApiClientError(
      500,
      'Tenant ID not configured. Set NEXT_PUBLIC_TENANT_ID in .env',
      'TENANT_NOT_CONFIGURED',
    );
  }

  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: { 'x-tenant-id': TENANT_ID },
  });
}

/** Logout — clears httpOnly cookies. */
export async function logout(): Promise<void> {
  await request<void>('/api/auth/logout', { method: 'POST' });
}

/** Refresh the access token via refresh cookie. */
export async function refreshToken(): Promise<void> {
  await request<void>('/api/auth/refresh', { method: 'POST' });
}

/** Request a password recovery email. Always returns success (no enumeration). */
export async function requestRecovery(email: string): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/password/recovery/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/** Reset password using a recovery token. */
export async function resetPassword(
  token: string,
  newPassword: string,
  confirmPassword: string,
): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/password/recovery/reset', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword, confirmPassword }),
  });
}

/** Force-change password for users with mustChangePassword=true. */
export async function forceChangePassword(
  newPassword: string,
  confirmPassword: string,
): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/password/force-change', {
    method: 'POST',
    body: JSON.stringify({ newPassword, confirmPassword }),
  });
}

/** Get current user abilities (used by context provider). */
export async function getAbilities(): Promise<AbilitiesResponse> {
  return request<AbilitiesResponse>('/api/auth/abilities');
}

/* ------------------------------------------------------------------ */
/* Admin API — Types                                                   */
/* ------------------------------------------------------------------ */

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Personal access event for the current user. */
export interface PersonalAccessEvent {
  id: string;
  timestamp: string;
  eventType: string;
  ipAddress: string;
  userAgent: string;
}

/** Active session row (admin view). */
export interface ActiveSession {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: string;
  createdAt: string;
}

/** Audit log entry (admin view). */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  event: string;
  actorId: string;
  actorEmail: string;
  ipAddress: string;
  metadata: Record<string, unknown>;
}

/** Audit log query filters. */
export interface AuditFilters {
  eventType?: string;
  from?: string;
  to?: string;
  actorId?: string;
  page?: number;
  pageSize?: number;
}

/** Session policy configuration. */
export interface SessionPolicy {
  inactivityTimeoutMinutes: number;
  maxSessionDurationHours: number;
  maxConcurrentSessions: number;
}

/** Permission review entry. */
export interface PermissionReview {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  module: string;
  action: string;
  scope: string;
  period: string;
  status: 'pending' | 'confirmed' | 'revoked' | 'expired';
}

/* ------------------------------------------------------------------ */
/* Admin API — Personal Access History                                 */
/* ------------------------------------------------------------------ */

/** Get the current user's own access events (paginated). */
export async function getPersonalAccessHistory(
  page = 1,
  pageSize = 20,
): Promise<PaginatedResponse<PersonalAccessEvent>> {
  const response = await request<unknown>(`/api/admin/audit/personal?page=${page}&pageSize=${pageSize}`);
  return normalizePaginatedResponse<PersonalAccessEvent>(response, page, pageSize);
}

/* ------------------------------------------------------------------ */
/* Admin API — Sessions                                                */
/* ------------------------------------------------------------------ */

/** List all active sessions (admin). */
export async function getActiveSessions(
  page = 1,
  pageSize = 20,
): Promise<PaginatedResponse<ActiveSession>> {
  const response = await request<unknown>(`/api/admin/sessions?page=${page}&pageSize=${pageSize}`);
  return normalizePaginatedResponse<ActiveSession>(response, page, pageSize);
}

/** Close (delete) a specific session by ID. */
export async function closeSession(sessionId: string): Promise<void> {
  return request<void>(`/api/admin/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}

/* ------------------------------------------------------------------ */
/* Admin API — Audit Log                                               */
/* ------------------------------------------------------------------ */

/** Get audit log entries with filters (admin). */
export async function getAuditLog(
  filters: AuditFilters = {},
): Promise<PaginatedResponse<AuditLogEntry>> {
  const params = new URLSearchParams();
  if (filters.eventType) params.set('eventType', filters.eventType);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.actorId) params.set('actorId', filters.actorId);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  const qs = params.toString();
  const response = await request<unknown>(`/api/admin/audit${qs ? `?${qs}` : ''}`);
  return normalizePaginatedResponse<AuditLogEntry>(response, filters.page ?? 1, filters.pageSize ?? 20);
}

/** Export audit log as CSV (triggers download). */
export async function exportAuditLog(filters: AuditFilters = {}): Promise<void> {
  const params = new URLSearchParams();
  if (filters.eventType) params.set('eventType', filters.eventType);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.actorId) params.set('actorId', filters.actorId);
  const qs = params.toString();
  const res = await fetch(`${API_BASE}/api/admin/audit/export${qs ? `?${qs}` : ''}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new ApiClientError(res.status, 'Export failed');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Admin API — Session Policy                                          */
/* ------------------------------------------------------------------ */

/** Get current session policy. */
export async function getSessionPolicy(): Promise<SessionPolicy> {
  return request<SessionPolicy>('/api/admin/session-policy');
}

/** Update session policy. */
export async function updateSessionPolicy(
  policy: SessionPolicy,
): Promise<SessionPolicy> {
  return request<SessionPolicy>('/api/admin/session-policy', {
    method: 'PUT',
    body: JSON.stringify(policy),
  });
}

/* ------------------------------------------------------------------ */
/* Admin API — Permission Reviews                                      */
/* ------------------------------------------------------------------ */

/** Get pending permission reviews. */
export async function getPermissionReviews(
  page = 1,
  pageSize = 20,
): Promise<PaginatedResponse<PermissionReview>> {
  const response = await request<unknown>(`/api/admin/permission-reviews?page=${page}&pageSize=${pageSize}`);
  return normalizePaginatedResponse<PermissionReview>(response, page, pageSize);
}

/** Generate a new review cycle. */
export async function generatePermissionReviews(): Promise<{
  message: string;
  count: number;
}> {
  return request<{ message: string; count: number }>(
    '/api/admin/permission-reviews/generate',
    { method: 'POST' },
  );
}

/** Confirm a permission review. */
export async function confirmPermissionReview(
  reviewId: string,
): Promise<PermissionReview> {
  return request<PermissionReview>(
    `/api/admin/permission-reviews/${reviewId}/confirm`,
    { method: 'PATCH' },
  );
}

/** Revoke a permission review. */
export async function revokePermissionReview(
  reviewId: string,
): Promise<PermissionReview> {
  return request<PermissionReview>(
    `/api/admin/permission-reviews/${reviewId}/revoke`,
    { method: 'PATCH' },
  );
}

/* ------------------------------------------------------------------ */
/* Admin API — User Management                                         */
/* ------------------------------------------------------------------ */

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  state: string;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserDetail extends UserListItem {
  tokenVersion: number;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  updatedAt: string;
  customPermissions: UserPermissionItem[];
}

export interface UserPermissionItem {
  id: string;
  module: string;
  action: string;
  scope: string;
}

export interface UserPermissionsResponse {
  custom: UserPermissionItem[];
  inherited: {
    role: string;
    permissions: Array<{ module: string; action: string; scope: string }>;
  };
}

export interface UsersFilters {
  role?: string;
  state?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getUsers(filters: UsersFilters = {}): Promise<PaginatedResponse<UserListItem>> {
  const params = new URLSearchParams();
  if (filters.role) params.set('role', filters.role);
  if (filters.state) params.set('state', filters.state);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  const response = await request<unknown>(`/api/admin/users${qs ? `?${qs}` : ''}`);
  const raw = response as Record<string, unknown>;
  const users = (raw.users ?? raw.data ?? []) as UserListItem[];
  const total = (raw.total ?? 0) as number;
  const page = (raw.page ?? 1) as number;
  const limit = (raw.limit ?? raw.pageSize ?? 20) as number;
  const totalPages = (raw.totalPages ?? 1) as number;
  return { data: users, total, page, pageSize: limit, totalPages };
}

export async function getUser(userId: string): Promise<UserDetail> {
  return request<UserDetail>(`/api/admin/users/${userId}`);
}

export async function createUser(data: {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  state?: string;
  mustChangePassword?: boolean;
}): Promise<UserDetail> {
  return request<UserDetail>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(userId: string, data: {
  firstName?: string;
  lastName?: string;
  role?: string;
  state?: string;
  mustChangePassword?: boolean;
}): Promise<UserDetail> {
  return request<UserDetail>(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function changeUserState(userId: string, state: string): Promise<UserDetail> {
  return request<UserDetail>(`/api/admin/users/${userId}/state`, {
    method: 'PATCH',
    body: JSON.stringify({ state }),
  });
}

export async function forceUserPasswordChange(userId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/admin/users/${userId}/force-password`, {
    method: 'PATCH',
    body: JSON.stringify({ mustChangePassword: true }),
  });
}

export async function getUserPermissions(userId: string): Promise<UserPermissionsResponse> {
  return request<UserPermissionsResponse>(`/api/admin/users/${userId}/permissions`);
}

export async function updateUserPermissions(userId: string, permissions: Array<{ module: string; action: string; scope: string }>): Promise<UserPermissionItem[]> {
  return request<UserPermissionItem[]>(`/api/admin/users/${userId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissions }),
  });
}

export async function deleteUserPermission(userId: string, permissionId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/admin/users/${userId}/permissions/${permissionId}`, {
    method: 'DELETE',
  });
}

// ─── Password Change (self-service) ──────────────────
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  return request<void>('/api/auth/password/change', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
