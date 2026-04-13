// ─── Enums (coinciden con los de la DB en schema.ts) ──────────────────────

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  WAITING = 'waiting',
  ATTENDED = 'attended',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum AppointmentSource {
  DESK = 'desk',
  WHATSAPP = 'whatsapp',
  WEB = 'web',
}

// ─── Conflict checking ──────────────────────────────────────────────────

export interface ConflictDetail {
  type: 'overlap' | 'exception' | 'holiday' | 'outside_hours';
  severity: 'hard' | 'soft';
  message: string;
}

export interface ConflictCheckResult {
  hardBlocks: ConflictDetail[];
  softWarnings: ConflictDetail[];
}

// ─── Availability ────────────────────────────────────────────────────────

export interface AvailabilitySlot {
  date: string;
  time: string;
  isAvailable: boolean;
}

// ─── Calendar view ──────────────────────────────────────────────────────

export interface CalendarAppointment {
  id: string;
  title: string;
  start: string;
  end: string;
  status: AppointmentStatus;
  professionalName: string;
  patientName: string;
  mutualName?: string;
}

// ─── Paginated result ───────────────────────────────────────────────────

export interface PaginatedAppointmentsResult<T = AppointmentListItem> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Appointment list item ──────────────────────────────────────────────

export interface AppointmentListItem {
  id: string;
  professionalId: string;
  professionalName: string;
  patientId: string;
  patientName: string;
  mutualId: string | null;
  mutualName: string | null;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  source: AppointmentSource;
  createdAt: Date;
}

// ─── Appointment detail ─────────────────────────────────────────────────

export interface AppointmentDetail extends AppointmentListItem {
  notes: string | null;
  reminderSentAt: Date | null;
  confirmedAt: Date | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  createdBy: string | null;
  updatedAt: Date;
}
