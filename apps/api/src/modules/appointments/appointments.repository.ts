import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  eq,
  gt,
  gte,
  ilike,
  lt,
  lte,
  or,
  type SQL,
} from 'drizzle-orm';
import { DatabaseService } from '../../infra/database/database.service.js';
import {
  appointments,
  mutuals,
  patients,
  users,
} from '../../infra/database/schema.js';
import type {
  AppointmentDetail,
  AppointmentListItem,
  AppointmentStatus,
  CalendarAppointment,
} from './appointments.types.js';
import type {
  CreateAppointmentInput,
  QueryAppointmentsInput,
  UpdateAppointmentInput,
} from '@sistema-odontologico/validation';

export interface CalendarFilters {
  professionalIds?: string[];
  status?: AppointmentStatus[];
}

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /**
   * Find appointment by ID with related data (professional name, patient name, mutual name).
   */
  async findById(
    id: string,
    tenantId: string,
  ): Promise<AppointmentDetail | null> {
    const db = this.dbService.db;

    const rows = await db
      .select({
        id: appointments.id,
        professionalId: appointments.professionalId,
        professionalName: users.firstName,
        professionalLastName: users.lastName,
        patientId: appointments.patientId,
        patientName: patients.firstName,
        patientLastName: patients.lastName,
        mutualId: appointments.mutualId,
        mutualName: mutuals.name,
        startAt: appointments.startAt,
        endAt: appointments.endAt,
        status: appointments.status,
        source: appointments.source,
        notes: appointments.notes,
        reminderSentAt: appointments.reminderSentAt,
        confirmedAt: appointments.confirmedAt,
        cancelledBy: appointments.cancelledBy,
        cancellationReason: appointments.cancellationReason,
        createdBy: appointments.createdBy,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.professionalId, users.id))
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(mutuals, eq(appointments.mutualId, mutuals.id))
      .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return this.mapToDetail(row);
  }

  /**
   * Find appointments by professional and date range (for calendar views).
   */
  async findByProfessionalAndDateRange(
    professionalId: string,
    dateFrom: Date,
    dateTo: Date,
    tenantId: string,
  ): Promise<AppointmentListItem[]> {
    const db = this.dbService.db;

    const rows = await db
      .select({
        id: appointments.id,
        professionalId: appointments.professionalId,
        professionalName: users.firstName,
        professionalLastName: users.lastName,
        patientId: appointments.patientId,
        patientName: patients.firstName,
        patientLastName: patients.lastName,
        mutualId: appointments.mutualId,
        mutualName: mutuals.name,
        startAt: appointments.startAt,
        endAt: appointments.endAt,
        status: appointments.status,
        source: appointments.source,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.professionalId, users.id))
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(mutuals, eq(appointments.mutualId, mutuals.id))
      .where(
        and(
          eq(appointments.professionalId, professionalId),
          eq(appointments.tenantId, tenantId),
          gte(appointments.startAt, dateFrom),
          lt(appointments.startAt, dateTo),
        ),
      )
      .orderBy(asc(appointments.startAt));

    return rows.map((r) => this.mapToListItem(r));
  }

  /**
   * Find all appointments for a patient.
   */
  async findByPatient(
    patientId: string,
    tenantId: string,
  ): Promise<AppointmentListItem[]> {
    const db = this.dbService.db;

    const rows = await db
      .select({
        id: appointments.id,
        professionalId: appointments.professionalId,
        professionalName: users.firstName,
        professionalLastName: users.lastName,
        patientId: appointments.patientId,
        patientName: patients.firstName,
        patientLastName: patients.lastName,
        mutualId: appointments.mutualId,
        mutualName: mutuals.name,
        startAt: appointments.startAt,
        endAt: appointments.endAt,
        status: appointments.status,
        source: appointments.source,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.professionalId, users.id))
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(mutuals, eq(appointments.mutualId, mutuals.id))
      .where(
        and(
          eq(appointments.patientId, patientId),
          eq(appointments.tenantId, tenantId),
        ),
      )
      .orderBy(asc(appointments.startAt));

    return rows.map((r) => this.mapToListItem(r));
  }

  /**
   * Find appointments with advanced filters and pagination.
   */
  async findByFilters(
    filters: QueryAppointmentsInput,
    tenantId: string,
  ): Promise<{
    data: AppointmentListItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    const db = this.dbService.db;

    const whereConditions: (SQL | undefined)[] = [
      eq(appointments.tenantId, tenantId),
    ];

    if (filters.professionalId) {
      whereConditions.push(eq(appointments.professionalId, filters.professionalId));
    }

    if (filters.patientId) {
      whereConditions.push(eq(appointments.patientId, filters.patientId));
    }

    if (filters.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      whereConditions.push(
        or(...statuses.map((s) => eq(appointments.status, s as AppointmentStatus))),
      );
    }

    if (filters.dateFrom) {
      whereConditions.push(gte(appointments.startAt, new Date(filters.dateFrom)));
    }

    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      whereConditions.push(lte(appointments.startAt, dateTo));
    }

    if (filters.mutualId) {
      whereConditions.push(eq(appointments.mutualId, filters.mutualId));
    }

    if (!filters.includeCancelled) {
      whereConditions.push(eq(appointments.status, 'cancelled'));
    }

    const whereClause = and(...whereConditions);

    const countResult = await db
      .select({ total: count() })
      .from(appointments)
      .where(whereClause);
    const total = countResult[0]?.total ?? 0;

    const page = filters.page;
    const limit = filters.limit;
    const offset = (page - 1) * limit;

    const rows = await db
      .select({
        id: appointments.id,
        professionalId: appointments.professionalId,
        professionalName: users.firstName,
        professionalLastName: users.lastName,
        patientId: appointments.patientId,
        patientName: patients.firstName,
        patientLastName: patients.lastName,
        mutualId: appointments.mutualId,
        mutualName: mutuals.name,
        startAt: appointments.startAt,
        endAt: appointments.endAt,
        status: appointments.status,
        source: appointments.source,
        createdAt: appointments.createdAt,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.professionalId, users.id))
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(mutuals, eq(appointments.mutualId, mutuals.id))
      .where(whereClause)
      .orderBy(asc(appointments.startAt))
      .limit(limit)
      .offset(offset);

    return {
      data: rows.map((r) => this.mapToListItem(r)),
      total,
      page,
      limit,
    };
  }

  /**
   * Create a new appointment.
   */
  async create(
    input: CreateAppointmentInput,
    tenantId: string,
  ): Promise<AppointmentDetail> {
    const db = this.dbService.db;

    const now = new Date();
    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);
    const mutualId = input.mutualId && input.mutualId.trim() ? input.mutualId : null;
    const notes = input.notes && input.notes.trim() ? input.notes.trim() : null;

    const [created] = await db
      .insert(appointments)
      .values({
        tenantId,
        professionalId: input.professionalId,
        patientId: input.patientId,
        mutualId,
        startAt,
        endAt,
        status: 'pending',
        source: input.source || 'desk',
        notes,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!created) {
      throw new Error('Appointment creation did not return a row');
    }

    return this.findById(created.id, tenantId) as Promise<AppointmentDetail>;
  }

  /**
   * Update an existing appointment.
   */
  async update(
    id: string,
    input: UpdateAppointmentInput,
    tenantId: string,
  ): Promise<AppointmentDetail> {
    const db = this.dbService.db;

    const existing = await this.findById(id, tenantId);
    if (!existing) {
      throw new Error(`Appointment ${id} not found for tenant ${tenantId}`);
    }

    const mutualId =
      input.mutualId !== undefined
        ? input.mutualId.trim() || null
        : undefined;
    const notes =
      input.notes !== undefined
        ? input.notes.trim() || null
        : undefined;

    await db
      .update(appointments)
      .set({
        ...(input.professionalId !== undefined && {
          professionalId: input.professionalId,
        }),
        ...(input.patientId !== undefined && { patientId: input.patientId }),
        ...(mutualId !== undefined && { mutualId }),
        ...(input.startAt !== undefined && { startAt: new Date(input.startAt) }),
        ...(input.endAt !== undefined && { endAt: new Date(input.endAt) }),
        ...(input.status !== undefined && { status: input.status }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date(),
      })
      .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)));

    const updated = await this.findById(id, tenantId);
    if (!updated) {
      throw new Error('Appointment update failed to return updated row');
    }

    return updated;
  }

  /**
   * Change appointment status.
   */
  async changeStatus(
    id: string,
    newStatus: AppointmentStatus,
    tenantId: string,
  ): Promise<AppointmentDetail> {
    const db = this.dbService.db;

    const existing = await this.findById(id, tenantId);
    if (!existing) {
      throw new Error(`Appointment ${id} not found for tenant ${tenantId}`);
    }

    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === 'confirmed') {
      updateData.confirmedAt = new Date();
    }

    await db
      .update(appointments)
      .set(updateData)
      .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)));

    const updated = await this.findById(id, tenantId);
    if (!updated) {
      throw new Error('Status change failed to return updated row');
    }

    return updated;
  }

  /**
   * Cancel an appointment with reason and actor tracking.
   */
  async cancel(
    id: string,
    reason: string,
    cancelledBy: string,
    tenantId: string,
  ): Promise<AppointmentDetail> {
    const db = this.dbService.db;

    const existing = await this.findById(id, tenantId);
    if (!existing) {
      throw new Error(`Appointment ${id} not found for tenant ${tenantId}`);
    }

    await db
      .update(appointments)
      .set({
        status: 'cancelled',
        cancellationReason: reason.trim(),
        cancelledBy,
        updatedAt: new Date(),
      })
      .where(and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)));

    const updated = await this.findById(id, tenantId);
    if (!updated) {
      throw new Error('Cancellation failed to return updated row');
    }

    return updated;
  }

  /**
   * Check if an appointment exists for a tenant.
   */
  async exists(id: string, tenantId: string): Promise<boolean> {
    const db = this.dbService.db;

    const rows = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(eq(appointments.id, id), eq(appointments.tenantId, tenantId)),
      )
      .limit(1);

    return rows.length > 0;
  }

  /**
   * Get calendar data optimized for FullCalendar component.
   */
  async getCalendarData(
    dateFrom: Date,
    dateTo: Date,
    filters: CalendarFilters,
    tenantId: string,
  ): Promise<CalendarAppointment[]> {
    const db = this.dbService.db;

    const whereConditions: (SQL | undefined)[] = [
      eq(appointments.tenantId, tenantId),
      gte(appointments.startAt, dateFrom),
      lt(appointments.startAt, dateTo),
    ];

    if (filters.professionalIds && filters.professionalIds.length > 0) {
      whereConditions.push(
        or(...filters.professionalIds.map((pid) => eq(appointments.professionalId, pid))),
      );
    }

    if (filters.status && filters.status.length > 0) {
      whereConditions.push(
        or(...filters.status.map((s) => eq(appointments.status, s))),
      );
    }

    const rows = await db
      .select({
        id: appointments.id,
        professionalName: users.firstName,
        professionalLastName: users.lastName,
        patientName: patients.firstName,
        patientLastName: patients.lastName,
        mutualName: mutuals.name,
        startAt: appointments.startAt,
        endAt: appointments.endAt,
        status: appointments.status,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.professionalId, users.id))
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(mutuals, eq(appointments.mutualId, mutuals.id))
      .where(and(...whereConditions))
      .orderBy(asc(appointments.startAt));

    return rows.map((row) => ({
      id: row.id,
      title: `${row.patientName} ${row.patientLastName} — ${row.professionalName} ${row.professionalLastName}`,
      start: row.startAt.toISOString(),
      end: row.endAt.toISOString(),
      status: row.status as AppointmentStatus,
      professionalName: `${row.professionalName} ${row.professionalLastName}`,
      patientName: `${row.patientName} ${row.patientLastName}`,
      mutualName: row.mutualName ?? undefined,
    }));
  }

  /**
   * Find next upcoming appointment for a patient by phone number (for WhatsApp bot).
   */
  async findNextForPatient(
    phoneNumber: string,
    tenantId: string,
  ): Promise<AppointmentDetail | null> {
    const db = this.dbService.db;

    const rows = await db
      .select({
        id: appointments.id,
        professionalId: appointments.professionalId,
        professionalName: users.firstName,
        professionalLastName: users.lastName,
        patientId: appointments.patientId,
        patientName: patients.firstName,
        patientLastName: patients.lastName,
        mutualId: appointments.mutualId,
        mutualName: mutuals.name,
        startAt: appointments.startAt,
        endAt: appointments.endAt,
        status: appointments.status,
        source: appointments.source,
        notes: appointments.notes,
        reminderSentAt: appointments.reminderSentAt,
        confirmedAt: appointments.confirmedAt,
        cancelledBy: appointments.cancelledBy,
        cancellationReason: appointments.cancellationReason,
        createdBy: appointments.createdBy,
        createdAt: appointments.createdAt,
        updatedAt: appointments.updatedAt,
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.professionalId, users.id))
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(mutuals, eq(appointments.mutualId, mutuals.id))
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          eq(patients.phone, phoneNumber),
          eq(appointments.status, 'confirmed'),
          gt(appointments.startAt, new Date()),
        ),
      )
      .orderBy(asc(appointments.startAt))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return this.mapToDetail(row);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private mapToListItem(row: {
    id: string;
    professionalId: string;
    professionalName: string;
    professionalLastName: string | null;
    patientId: string;
    patientName: string;
    patientLastName: string | null;
    mutualId: string | null;
    mutualName: string | null;
    startAt: Date;
    endAt: Date;
    status: string;
    source: string;
    createdAt: Date;
  }): AppointmentListItem {
    return {
      id: row.id,
      professionalId: row.professionalId,
      professionalName: `${row.professionalName} ${row.professionalLastName ?? ''}`.trim(),
      patientId: row.patientId,
      patientName: `${row.patientName} ${row.patientLastName ?? ''}`.trim(),
      mutualId: row.mutualId,
      mutualName: row.mutualName,
      startAt: row.startAt,
      endAt: row.endAt,
      status: row.status as AppointmentStatus,
      source: row.source as AppointmentListItem['source'],
      createdAt: row.createdAt,
    };
  }

  private mapToDetail(row: {
    id: string;
    professionalId: string;
    professionalName: string;
    professionalLastName: string | null;
    patientId: string;
    patientName: string;
    patientLastName: string | null;
    mutualId: string | null;
    mutualName: string | null;
    startAt: Date;
    endAt: Date;
    status: string;
    source: string;
    notes: string | null;
    reminderSentAt: Date | null;
    confirmedAt: Date | null;
    cancelledBy: string | null;
    cancellationReason: string | null;
    createdBy: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): AppointmentDetail {
    return {
      id: row.id,
      professionalId: row.professionalId,
      professionalName: `${row.professionalName} ${row.professionalLastName ?? ''}`.trim(),
      patientId: row.patientId,
      patientName: `${row.patientName} ${row.patientLastName ?? ''}`.trim(),
      mutualId: row.mutualId,
      mutualName: row.mutualName,
      startAt: row.startAt,
      endAt: row.endAt,
      status: row.status as AppointmentStatus,
      source: row.source as AppointmentListItem['source'],
      createdAt: row.createdAt,
      notes: row.notes,
      reminderSentAt: row.reminderSentAt,
      confirmedAt: row.confirmedAt,
      cancelledBy: row.cancelledBy,
      cancellationReason: row.cancellationReason,
      createdBy: row.createdBy,
      updatedAt: row.updatedAt,
    };
  }
}
