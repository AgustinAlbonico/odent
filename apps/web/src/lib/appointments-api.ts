/* ------------------------------------------------------------------ */
/* Internal fetch helper                                               */
/* ------------------------------------------------------------------ */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Internal fetch wrapper that attaches auth headers automatically.
 * Mirrors the pattern used by the auth/api.ts request() helper.
 */
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    throw new Error(body.message ?? body.error ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/* Paginated response helper                                           */
/* ------------------------------------------------------------------ */

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function toPositiveNumber(value: unknown, fallback: number): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function normalizePaginated<T>(
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
    meta?: {
      page?: number;
      pageSize?: number;
      total?: number;
      totalPages?: number;
    };
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

  return { data, total: normalizedTotal, page, pageSize, totalPages };
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'waiting'
  | 'attended'
  | 'cancelled'
  | 'no_show';

export type AppointmentSource = 'desk' | 'whatsapp' | 'web';

export type CalendarViewType = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'timeGrid24h';

export interface Appointment {
  id: string;
  professionalId: string;
  professionalName: string;
  patientId: string;
  patientName: string;
  mutualId: string | null;
  mutualName: string | null;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentListItem {
  id: string;
  professionalName: string;
  patientName: string;
  patientDni: string | null;
  mutualName: string | null;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  source: AppointmentSource;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    appointmentId: string;
    professionalId: string;
    professionalName: string;
    patientId: string;
    patientName: string;
    mutualName: string | null;
    status: AppointmentStatus;
    source: AppointmentSource;
    notes: string | null;
  };
}

export interface AppointmentsFilters {
  page?: number;
  limit?: number;
  professionalId?: string;
  patientId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  mutualId?: string;
  includeCancelled?: boolean;
  search?: string;
}

export interface CreateAppointmentInput {
  professionalId: string;
  patientId: string;
  mutualId?: string;
  startAt: string;
  endAt: string;
  notes?: string;
}

export interface UpdateAppointmentInput {
  professionalId?: string;
  patientId?: string;
  mutualId?: string;
  startAt?: string;
  endAt?: string;
  notes?: string;
}

/* Availability */

export interface AvailabilitySlot {
  start: string;
  end: string;
  available: boolean;
}

export interface AvailabilityResponse {
  professionalId: string;
  from: string;
  to: string;
  slots: AvailabilitySlot[];
  conflicts: Array<{
    type: 'hard' | 'soft';
    message: string;
    startAt: string;
    endAt: string;
  }>;
}

/* Schedules */

export interface Schedule {
  id: string;
  professionalId: string;
  professionalName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

export interface CreateScheduleInput {
  professionalId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

/* Exceptions */

export interface Exception {
  id: string;
  professionalId: string;
  professionalName: string;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  reason: string;
  type: 'full_day' | 'time_range';
  createdAt: string;
}

export interface CreateExceptionInput {
  professionalId: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason: string;
  type: 'full_day' | 'time_range';
}

/* Holidays */

export interface Holiday {
  id: string;
  date: string;
  name: string;
  isNational: boolean;
}

export interface AddHolidayInput {
  date: string;
  name: string;
}

/* Catalog helpers */

export interface ProfessionalSelectItem {
  id: string;
  name: string;
  specialty: string | null;
}

export interface PatientSelectItem {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  dni: string | null;
}

export interface MutualSelectItem {
  id: string;
  name: string;
  code: string | null;
}

/* ------------------------------------------------------------------ */
/* API functions                                                       */
/* ------------------------------------------------------------------ */

/** Fetch paginated list of appointments with filters. */
export async function getAppointments(
  filters: AppointmentsFilters = {},
): Promise<PaginatedResponse<AppointmentListItem>> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.professionalId) params.set('professionalId', filters.professionalId);
  if (filters.patientId) params.set('patientId', filters.patientId);
  if (filters.status) params.set('status', filters.status);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.mutualId) params.set('mutualId', filters.mutualId);
  if (filters.includeCancelled) params.set('includeCancelled', 'true');
  if (filters.search) params.set('search', filters.search);

  const qs = params.toString();
  const payload = await apiFetch<Record<string, unknown>>(`/api/appointments${qs ? `?${qs}` : ''}`);

  return normalizePaginated<AppointmentListItem>(payload, filters.page ?? 1, filters.limit ?? 20);
}

/** Fetch a single appointment by ID. */
export async function getAppointment(id: string): Promise<Appointment> {
  return apiFetch<Appointment>(`/api/appointments/${id}`);
}

/** Create a new appointment. */
export async function createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
  return apiFetch<Appointment>('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Update an existing appointment. */
export async function updateAppointment(
  id: string,
  input: UpdateAppointmentInput,
): Promise<Appointment> {
  return apiFetch<Appointment>(`/api/appointments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

/** Change appointment status (state machine transition). */
export async function changeAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  return apiFetch<Appointment>(`/api/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/** Cancel an appointment with mandatory reason. */
export async function cancelAppointment(id: string, reason: string): Promise<Appointment> {
  return apiFetch<Appointment>(`/api/appointments/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/** Get calendar events for a date range. */
export async function getCalendarData(
  from: string,
  to: string,
  filters?: { professionalIds?: string[]; status?: string[] },
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams();
  params.set('from', from);
  params.set('to', to);
  if (filters?.professionalIds?.length) {
    params.set('professionalIds', filters.professionalIds.join(','));
  }
  if (filters?.status?.length) {
    params.set('status', filters.status.join(','));
  }
  const raw = await apiFetch<Array<Record<string, unknown>>>(
    `/api/appointments/calendar?${params.toString()}`,
  );

  return raw.map((item) => {
    const extendedPropsRaw = item.extendedProps as Record<string, unknown> | undefined;

    if (extendedPropsRaw) {
      return item as unknown as CalendarEvent;
    }

    return {
      id: String(item.id ?? ''),
      title: String(item.title ?? ''),
      start: String(item.start ?? ''),
      end: String(item.end ?? ''),
      extendedProps: {
        appointmentId: String(item.id ?? ''),
        professionalId: String(item.professionalId ?? ''),
        professionalName: String(item.professionalName ?? ''),
        patientId: String(item.patientId ?? ''),
        patientName: String(item.patientName ?? ''),
        mutualName: (item.mutualName as string | null | undefined) ?? null,
        status: (item.status as AppointmentStatus | undefined) ?? 'pending',
        source: (item.source as AppointmentSource | undefined) ?? 'desk',
        notes: (item.notes as string | null | undefined) ?? null,
      },
    } satisfies CalendarEvent;
  });
}

/** Get availability for a professional on a date range. */
export async function getAvailability(
  professionalId: string,
  from: string,
  to: string,
): Promise<AvailabilityResponse> {
  const params = new URLSearchParams();
  params.set('professionalId', professionalId);
  params.set('from', from);
  params.set('to', to);
  return apiFetch<AvailabilityResponse>(`/api/appointments/availability?${params.toString()}`);
}

/* ---- Schedules ---- */

/** Get schedules, optionally filtered by professional. */
export async function getSchedules(professionalId?: string): Promise<Schedule[]> {
  const qs = professionalId ? `?professionalId=${professionalId}` : '';
  return apiFetch<Schedule[]>(`/api/appointments/schedules${qs}`);
}

/** Create a new schedule. */
export async function createSchedule(input: CreateScheduleInput): Promise<Schedule> {
  return apiFetch<Schedule>('/api/appointments/schedules', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Delete a schedule. */
export async function deleteSchedule(id: string): Promise<void> {
  return apiFetch<void>(`/api/appointments/schedules/${id}`, {
    method: 'DELETE',
  });
}

/* ---- Exceptions ---- */

/** Get exceptions, optionally filtered. */
export async function getExceptions(
  professionalId?: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<Exception[]> {
  const params = new URLSearchParams();
  if (professionalId) params.set('professionalId', professionalId);
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);
  const qs = params.toString();
  return apiFetch<Exception[]>(`/api/appointments/exceptions${qs ? `?${qs}` : ''}`);
}

/** Create a new exception. */
export async function createException(input: CreateExceptionInput): Promise<Exception> {
  return apiFetch<Exception>('/api/appointments/exceptions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Delete an exception. */
export async function deleteException(id: string): Promise<void> {
  return apiFetch<void>(`/api/appointments/exceptions/${id}`, {
    method: 'DELETE',
  });
}

/* ---- Holidays ---- */

/** Get holidays for a year. */
export async function getHolidays(year?: number): Promise<Holiday[]> {
  const qs = year ? `?year=${year}` : '';
  return apiFetch<Holiday[]>(`/api/appointments/holidays${qs}`);
}

/** Add a custom holiday. */
export async function addHoliday(input: AddHolidayInput): Promise<Holiday> {
  return apiFetch<Holiday>('/api/appointments/holidays', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Sync holidays from external API for a year. */
export async function syncHolidays(year: number): Promise<Holiday[]> {
  return apiFetch<Holiday[]>(`/api/appointments/holidays/sync?year=${year}`, {
    method: 'POST',
  });
}

/* ---- Catalog helpers ---- */

/** Get professionals for select dropdowns. */
export async function getProfessionals(): Promise<ProfessionalSelectItem[]> {
  return apiFetch<ProfessionalSelectItem[]>('/api/appointments/professionals');
}

/** Get patients for select/search dropdowns. */
export async function getPatientsForSelect(search?: string): Promise<PatientSelectItem[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}&limit=50` : '?limit=50';
  const result = await apiFetch<{
    data: Array<{
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      name?: string | null;
      dni?: string | null;
    }>;
  }>(`/api/admin/patients${qs}`);

  return (result.data ?? []).map((patient) => {
    const firstName = (patient.firstName ?? '').trim();
    const lastName = (patient.lastName ?? '').trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    return {
      id: patient.id,
      firstName,
      lastName,
      name: fullName || (patient.name ?? '').trim() || 'Paciente sin nombre',
      dni: patient.dni ?? null,
    } satisfies PatientSelectItem;
  });
}

/** Get mutuals for select dropdowns. */
export async function getMutualsForSelect(): Promise<MutualSelectItem[]> {
  const result = await apiFetch<{ data: MutualSelectItem[] }>('/api/mutuals?limit=200');
  return result.data ?? [];
}
