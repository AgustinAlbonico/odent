import type { PermissionEntry } from '@sistema-odontologico/permissions';

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
  photoUrl?: string | null;
  phone?: string | null;
  licenseNumber?: string | null;
  specialty?: string | null;
  dni?: string | null;
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
    res.status === 401 &&
    !path.includes('/api/auth/refresh') &&
    !path.includes('/api/auth/login')
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
  const total =
    toPositiveNumber(meta.total ?? raw.total, data.length || 1) - (data.length === 0 ? 1 : 0);
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

/** Change own password (authenticated user). */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/password/change', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Update own profile data. */
export async function updateMyProfile(data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  licenseNumber?: string;
  specialty?: string;
  dni?: string;
}): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
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
  assignedBy: string;
  assignedAt: string;
  status: string;
}

export interface MutualCatalogItem {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalMutual {
  id: string;
  professionalId: string;
  mutualId: string;
  mutualName?: string;
  mutualCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Admin API — Audit & Security                                        */
/* ------------------------------------------------------------------ */

export async function getAuditLogs(
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
  const raw = await request<unknown>(`/api/admin/audit${qs ? `?${qs}` : ''}`);
  return normalizePaginatedResponse<AuditLogEntry>(raw, 1, 20);
}

export async function getPersonalAccessLog(): Promise<PersonalAccessEvent[]> {
  return request<PersonalAccessEvent[]>('/api/admin/audit/personal-access');
}

/** Get active sessions for the admin dashboard. */
export async function getActiveSessions(): Promise<ActiveSession[]> {
  return request<ActiveSession[]>('/api/admin/audit/sessions');
}

/** Force-terminate a session by ID. Requires ADMIN_POLICIES scope. */
export async function terminateSession(sessionId: string): Promise<void> {
  return request<void>(`/api/admin/audit/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}

/** Get session policy configuration. */
export async function getSessionPolicy(): Promise<SessionPolicy> {
  return request<SessionPolicy>('/api/admin/session-policy');
}

/** Update session policy configuration. */
export async function updateSessionPolicy(data: Partial<SessionPolicy>): Promise<SessionPolicy> {
  return request<SessionPolicy>('/api/admin/session-policy', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/** Get pending permission reviews. */
export async function getPermissionReviews(): Promise<PermissionReview[]> {
  return request<PermissionReview[]>('/api/admin/permission-reviews');
}

/** Acknowledge a permission review. */
export async function acknowledgePermissionReview(reviewId: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/api/admin/permission-reviews/${reviewId}/acknowledge`, {
    method: 'POST',
  });
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
  lastLoginAt: string | null;
  photoUrl: string | null;
  createdAt: string;
}

export interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  state: string;
  mustChangePassword: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  tokenVersion: number;
  lastLoginAt: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ProfessionalListItem = UserListItem;
export type ProfessionalDetail = UserDetail;

export interface UsersFilters {
  search?: string;
  role?: string;
  state?: string;
  page?: number;
  limit?: number;
}

export interface ProfessionalsFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserPermissionsResponse {
  custom: {
    id: string;
    module: string;
    action: string;
    scope: string;
  }[];
  inherited: {
    role: string;
    permissions: {
      module: string;
      action: string;
      scope: string;
    }[];
  };
}

export async function getUsers(
  filters: UsersFilters = {},
): Promise<PaginatedResponse<UserListItem>> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.role) params.set('role', filters.role);
  if (filters.state) params.set('state', filters.state);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  const response = await request<unknown>(`/api/admin/users${qs ? `?${qs}` : ''}`);
  const raw = response as Record<string, unknown>;
  const data = (raw.data ?? []) as UserListItem[];
  const total = (raw.total ?? 0) as number;
  const page = (raw.page ?? 1) as number;
  const limit = (raw.limit ?? raw.pageSize ?? 20) as number;
  const totalPages = (raw.totalPages ?? 1) as number;
  return { data, total, page, pageSize: limit, totalPages };
}

export async function getUser(userId: string): Promise<UserDetail> {
  return request<UserDetail>(`/api/admin/users/${userId}`);
}

export async function getProfessionalsList(
  filters: ProfessionalsFilters = {},
): Promise<PaginatedResponse<ProfessionalListItem>> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  const response = await request<unknown>(`/api/admin/professionals${qs ? `?${qs}` : ''}`);
  const raw = response as Record<string, unknown>;
  const data = (raw.data ?? []) as ProfessionalListItem[];
  const total = (raw.total ?? 0) as number;
  const page = (raw.page ?? 1) as number;
  const limit = (raw.limit ?? raw.pageSize ?? 20) as number;
  const totalPages = (raw.totalPages ?? 1) as number;
  return { data, total, page, pageSize: limit, totalPages };
}

export async function getProfessional(professionalId: string): Promise<ProfessionalDetail> {
  return request<ProfessionalDetail>(`/api/admin/professionals/${professionalId}`);
}

export async function uploadProfessionalPhoto(
  professionalId: string,
  file: Blob,
): Promise<{ photoUrl: string }> {
  const formData = new FormData();
  formData.append('photo', file, 'photo.webp');

  const res = await fetch(`${API_BASE}/api/admin/professionals/${professionalId}/photo`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
    // NOTE: Do NOT set Content-Type — browser sets it automatically with boundary for multipart/form-data
  });

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const retryRes = await fetch(`${API_BASE}/api/admin/professionals/${professionalId}/photo`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (retryRes.ok) return retryRes.json();
      const body = await retryRes.json().catch(() => ({}));
      throw body;
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw body;
  }

  return res.json();
}

export async function deleteProfessionalPhoto(professionalId: string): Promise<void> {
  return request<void>(`/api/admin/professionals/${professionalId}/photo`, {
    method: 'DELETE',
  });
}

export async function uploadMyPhoto(file: Blob): Promise<{ photoUrl: string }> {
  const formData = new FormData();
  formData.append('photo', file, 'photo.webp');

  const res = await fetch(`${API_BASE}/api/professionals/me/photo`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const retryRes = await fetch(`${API_BASE}/api/professionals/me/photo`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (retryRes.ok) return retryRes.json();
      const body = await retryRes.json().catch(() => ({}));
      throw body;
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw body;
  }

  return res.json();
}

export async function deleteMyPhoto(): Promise<void> {
  return request<void>('/api/professionals/me/photo', {
    method: 'DELETE',
  });
}

export async function createUser(data: {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  state: string;
}): Promise<UserDetail> {
  return request<UserDetail>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    role?: string;
    state?: string;
  },
): Promise<UserDetail> {
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

export async function forceUserPasswordChange(userId: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/api/admin/users/${userId}/force-password-change`, {
    method: 'POST',
  });
}

export async function getUserPermissions(userId: string): Promise<UserPermissionsResponse> {
  return request<UserPermissionsResponse>(`/api/admin/users/${userId}/permissions`);
}

/* ------------------------------------------------------------------ */
/* Admin API — Patient Management                                      */
/* ------------------------------------------------------------------ */

export interface PatientListItem {
  id: string;
  dni: string | null;
  firstName: string;
  lastName: string;
  sex: 'male' | 'female' | 'other' | null;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  state: 'active' | 'inactive';
  createdAt: string;
}

export interface PatientDetail extends PatientListItem {
  bloodGroup: 'A' | 'B' | 'AB' | 'O' | null;
  rhFactor: 'positive' | 'negative' | null;
  address: string | null;
  postalCode: string | null;
  notes: string | null;
  updatedAt: string;
}

export interface PatientDetail extends PatientListItem {
  address: string | null;
  notes: string | null;
  updatedAt: string;
}

export interface PatientMutual {
  id: string;
  patientId: string;
  mutualId: string;
  mutualName?: string;
  mutualCode?: string;
  planName: string | null;
  affiliateNumber: string;
  coveragePercent: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientsFilters {
  search?: string;
  state?: 'active' | 'inactive';
  page?: number;
  limit?: number;
}

export async function getPatients(
  filters: PatientsFilters = {},
): Promise<PaginatedResponse<PatientListItem>> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.state) params.set('state', filters.state);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  const response = await request<unknown>(`/api/admin/patients${qs ? `?${qs}` : ''}`);
  const raw = response as Record<string, unknown>;
  const data = (raw.data ?? []) as PatientListItem[];
  const total = (raw.total ?? 0) as number;
  const page = (raw.page ?? 1) as number;
  const limit = (raw.limit ?? raw.pageSize ?? 20) as number;
  const totalPages = (raw.totalPages ?? 1) as number;
  return { data, total, page, pageSize: limit, totalPages };
}

export async function getPatient(patientId: string): Promise<PatientDetail> {
  return request<PatientDetail>(`/api/admin/patients/${patientId}`);
}

export async function createPatient(data: {
  dni?: string;
  firstName: string;
  lastName: string;
  sex?: 'male' | 'female' | 'other';
  email?: string;
  phone?: string;
  birthDate?: string;
  bloodGroup?: 'A' | 'B' | 'AB' | 'O';
  rhFactor?: 'positive' | 'negative';
  address?: string;
  postalCode?: string;
  notes?: string;
}): Promise<PatientDetail> {
  return request<PatientDetail>('/api/admin/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePatient(
  patientId: string,
  data: {
    dni?: string;
    firstName?: string;
    lastName?: string;
    sex?: 'male' | 'female' | 'other';
    email?: string;
    phone?: string;
    birthDate?: string;
    bloodGroup?: 'A' | 'B' | 'AB' | 'O';
    rhFactor?: 'positive' | 'negative';
    address?: string;
    postalCode?: string;
    notes?: string;
  },
): Promise<PatientDetail> {
  return request<PatientDetail>(`/api/admin/patients/${patientId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function changePatientState(
  patientId: string,
  state: 'active' | 'inactive',
): Promise<PatientDetail> {
  return request<PatientDetail>(`/api/admin/patients/${patientId}/state`, {
    method: 'PATCH',
    body: JSON.stringify({ state }),
  });
}

export async function getPatientMutuals(patientId: string): Promise<PatientMutual[]> {
  return request<PatientMutual[]>(`/api/admin/patients/${patientId}/mutuals`);
}

export async function addPatientMutual(
  patientId: string,
  data: {
    mutualId: string;
    planName?: string;
    affiliateNumber: string;
    coveragePercent?: number;
    isActive?: boolean;
  },
): Promise<PatientMutual> {
  return request<PatientMutual>(`/api/admin/patients/${patientId}/mutuals`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePatientMutual(
  patientId: string,
  mutualLinkId: string,
  data: {
    planName?: string;
    affiliateNumber?: string;
    coveragePercent?: number;
    isActive?: boolean;
  },
): Promise<PatientMutual> {
  return request<PatientMutual>(`/api/admin/patients/${patientId}/mutuals/${mutualLinkId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function removePatientMutual(patientId: string, mutualId: string): Promise<void> {
  return request<void>(`/api/admin/patients/${patientId}/mutuals/${mutualId}`, {
    method: 'DELETE',
  });
}

/* ------------------------------------------------------------------ */
/* Mutuals Catalog API                                                 */
/* ------------------------------------------------------------------ */

export interface MutualsFilters {
  search?: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}

export async function getMutuals(
  filters: MutualsFilters = {},
): Promise<PaginatedResponse<MutualCatalogItem>> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.includeInactive) params.set('includeInactive', 'true');
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  const response = await request<unknown>(`/api/admin/mutuals${qs ? `?${qs}` : ''}`);
  const raw = response as Record<string, unknown>;
  const data = (raw.data ?? []) as MutualCatalogItem[];
  const total = (raw.total ?? 0) as number;
  const page = (raw.page ?? 1) as number;
  const limit = (raw.limit ?? raw.pageSize ?? 20) as number;
  const totalPages = (raw.totalPages ?? 1) as number;
  return { data, total, page, pageSize: limit, totalPages };
}

export async function getMutualById(id: string): Promise<MutualCatalogItem> {
  return request<MutualCatalogItem>(`/api/admin/mutuals/${id}`);
}

export async function createMutual(data: {
  name: string;
  code: string;
  phone?: string;
}): Promise<MutualCatalogItem> {
  return request<MutualCatalogItem>('/api/admin/mutuals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMutual(
  id: string,
  data: {
    name?: string;
    code?: string;
    phone?: string;
  },
): Promise<MutualCatalogItem> {
  return request<MutualCatalogItem>(`/api/admin/mutuals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteMutual(id: string): Promise<MutualCatalogItem> {
  return request<MutualCatalogItem>(`/api/admin/mutuals/${id}`, {
    method: 'DELETE',
  });
}

/* ------------------------------------------------------------------ */
/* Professional Mutuals API                                            */
/* ------------------------------------------------------------------ */

export async function getProfessionalMutuals(
  professionalId: string,
): Promise<ProfessionalMutual[]> {
  return request<ProfessionalMutual[]>(`/api/admin/professionals/${professionalId}/mutuals`);
}

export async function addProfessionalMutual(
  professionalId: string,
  data: {
    mutualId: string;
  },
): Promise<ProfessionalMutual> {
  return request<ProfessionalMutual>(`/api/admin/professionals/${professionalId}/mutuals`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeProfessionalMutual(
  professionalId: string,
  mutualId: string,
): Promise<void> {
  return request<void>(`/api/admin/professionals/${professionalId}/mutuals/${mutualId}`, {
    method: 'DELETE',
  });
}

/**
 * Lightweight global search for patients — used by the header search bar.
 * Returns up to 8 results matching DNI, name, or lastname.
 */
export interface PatientSearchResult {
  id: string;
  dni: string | null;
  firstName: string;
  lastName: string;
  state: 'active' | 'inactive';
}

export async function searchPatientsGlobal(query: string): Promise<PatientSearchResult[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams();
  params.set('search', query.trim());
  params.set('limit', '8');
  params.set('page', '1');
  const response = await request<unknown>(`/api/admin/patients?${params.toString()}`);
  const raw = response as Record<string, unknown>;
  const data = (raw.data ?? []) as PatientSearchResult[];
  return data;
}
