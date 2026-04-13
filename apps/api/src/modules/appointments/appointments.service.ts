import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gte, lt, notInArray, sql } from 'drizzle-orm';
import { DatabaseService } from '../../infra/database/database.service.js';
import {
  appointmentAuditLog,
  appointmentExceptions,
  appointmentSchedules,
  appointments,
  holidays,
  users,
} from '../../infra/database/schema.js';
import { createAppointmentSchema, updateAppointmentSchema } from '@sistema-odontologico/validation';
import type {
  AppointmentDetail,
  AppointmentListItem,
  AppointmentStatus,
  AvailabilitySlot,
  CalendarAppointment,
  ConflictDetail,
} from './appointments.types.js';
import type { CalendarFilters } from './appointments.repository.js';
import type {
  CreateAppointmentInput,
  QueryAppointmentsInput,
  UpdateAppointmentInput,
} from '@sistema-odontologico/validation';
import { AppointmentsRepository } from './appointments.repository.js';
import { ConflictsService } from './conflicts.service.js';
import { StateTransitionsService } from './state-transitions.service.js';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly repository: AppointmentsRepository,
    private readonly conflictsService: ConflictsService,
    private readonly stateTransitions: StateTransitionsService,
    private readonly dbService: DatabaseService,
  ) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────

  async create(
    input: CreateAppointmentInput,
    tenantId: string,
    userId?: string,
  ): Promise<{ appointment: AppointmentDetail; warnings: ConflictDetail[] }> {
    const parseResult = createAppointmentSchema.safeParse(input);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.flatten().fieldErrors);
    }

    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);

    const conflicts = await this.conflictsService.checkConflicts(
      input.professionalId,
      startAt,
      endAt,
      tenantId,
    );

    if (conflicts.hardBlocks.length > 0) {
      throw new ConflictException({
        message: 'No se puede crear el turno por conflictos de horario',
        conflicts: conflicts.hardBlocks,
      });
    }

    const appointment = await this.repository.create(input, tenantId);

    return { appointment, warnings: conflicts.softWarnings };
  }

  async update(
    id: string,
    input: UpdateAppointmentInput,
    tenantId: string,
    userId?: string,
  ): Promise<{ appointment: AppointmentDetail; warnings: ConflictDetail[] }> {
    const existing = await this.repository.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundException(`Turno ${id} no encontrado`);
    }

    const parseResult = updateAppointmentSchema.safeParse(input);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.flatten().fieldErrors);
    }

    const timeChanged =
      input.startAt !== undefined ||
      input.endAt !== undefined ||
      input.professionalId !== undefined;

    let warnings: ConflictDetail[] = [];

    if (timeChanged) {
      const startAt = new Date(input.startAt ?? existing.startAt);
      const endAt = new Date(input.endAt ?? existing.endAt);
      const professionalId = input.professionalId ?? existing.professionalId;

      const conflicts = await this.conflictsService.checkConflicts(
        professionalId,
        startAt,
        endAt,
        tenantId,
        id,
      );

      if (conflicts.hardBlocks.length > 0) {
        throw new ConflictException({
          message: 'No se puede actualizar el turno por conflictos de horario',
          conflicts: conflicts.hardBlocks,
        });
      }

      warnings = conflicts.softWarnings;
    }

    const appointment = await this.repository.update(id, input, tenantId);

    if (timeChanged) {
      await this.logReschedule(id, existing, tenantId, userId ?? null);
    }

    return { appointment, warnings };
  }

  async findOne(id: string, tenantId: string): Promise<AppointmentDetail> {
    const appointment = await this.repository.findById(id, tenantId);
    if (!appointment) {
      throw new NotFoundException(`Turno ${id} no encontrado`);
    }
    return appointment;
  }

  async findAll(
    filters: QueryAppointmentsInput,
    tenantId: string,
  ): Promise<{
    data: AppointmentListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.repository.findByFilters(filters, tenantId);
    const totalPages = Math.ceil(result.total / result.limit);

    return {
      ...result,
      totalPages,
    };
  }

  // ─── Status management ─────────────────────────────────────────────────

  async changeStatus(
    id: string,
    newStatus: string,
    tenantId: string,
    userId: string | null,
  ): Promise<AppointmentDetail> {
    const existing = await this.repository.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundException(`Turno ${id} no encontrado`);
    }

    this.stateTransitions.validateTransition(existing.status, newStatus);

    await this.stateTransitions.executeTransition(id, existing.status, newStatus, userId, tenantId);

    const appointment = await this.repository.changeStatus(
      id,
      newStatus as AppointmentStatus,
      tenantId,
    );

    return appointment;
  }

  async cancel(
    id: string,
    reason: string,
    tenantId: string,
    userId: string,
  ): Promise<AppointmentDetail> {
    const existing = await this.repository.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundException(`Turno ${id} no encontrado`);
    }

    this.stateTransitions.validateTransition(existing.status, 'cancelled');

    await this.stateTransitions.executeTransition(
      id,
      existing.status,
      'cancelled',
      userId,
      tenantId,
    );

    const appointment = await this.repository.cancel(id, reason, userId, tenantId);

    return appointment;
  }

  // ─── Professionals for select ────────────────────────────────────────────

  async findProfessionalsForSelect(
    tenantId: string,
  ): Promise<Array<{ id: string; name: string; specialty: string | null }>> {
    const rows = await this.dbService.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(
        and(eq(users.role, 'profesional'), eq(users.state, 'active'), eq(users.tenantId, tenantId)),
      );

    return rows.map((r) => ({
      id: r.id,
      name: `${r.firstName} ${r.lastName}`,
      specialty: null,
    }));
  }

  // ─── Calendar & availability ───────────────────────────────────────────

  async getCalendarData(
    dateFrom: Date,
    dateTo: Date,
    filters: CalendarFilters,
    tenantId: string,
  ): Promise<CalendarAppointment[]> {
    return this.repository.getCalendarData(dateFrom, dateTo, filters, tenantId);
  }

  async getAvailability(
    professionalId: string,
    dateFrom: Date,
    dateTo: Date,
    tenantId: string,
  ): Promise<AvailabilitySlot[]> {
    const db = this.dbService.db;

    // 1. Get professional's regular schedules
    const schedules = await db
      .select()
      .from(appointmentSchedules)
      .where(
        and(
          eq(appointmentSchedules.tenantId, tenantId),
          eq(appointmentSchedules.professionalId, professionalId),
          eq(appointmentSchedules.isActive, true),
        ),
      );

    // 2. Get existing appointments in range (excluding cancelled/no_show)
    const existingAppointments = await db
      .select({
        startAt: appointments.startAt,
        endAt: appointments.endAt,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          eq(appointments.professionalId, professionalId),
          notInArray(appointments.status, ['cancelled', 'no_show']),
          gte(appointments.startAt, dateFrom),
          lt(appointments.startAt, dateTo),
        ),
      );

    // 3. Get exceptions in range
    const exceptions = await db
      .select()
      .from(appointmentExceptions)
      .where(
        and(
          eq(appointmentExceptions.tenantId, tenantId),
          eq(appointmentExceptions.professionalId, professionalId),
          sql`${appointmentExceptions.endDate}::date >= ${dateFrom.toISOString().split('T')[0]}::date`,
          sql`${appointmentExceptions.startDate}::date <= ${dateTo.toISOString().split('T')[0]}::date`,
        ),
      );

    // 4. Get holidays in range
    const holidaysInRange = await db
      .select()
      .from(holidays)
      .where(
        and(
          eq(holidays.tenantId, tenantId),
          eq(holidays.isActive, true),
          sql`${holidays.date}::date >= ${dateFrom.toISOString().split('T')[0]}::date`,
          sql`${holidays.date}::date <= ${dateTo.toISOString().split('T')[0]}::date`,
        ),
      );

    // 5. Generate available slots
    const slots: AvailabilitySlot[] = [];
    const holidayDates = new Set(holidaysInRange.map((h) => h.date.toISOString().split('T')[0]));

    // Iterate through each day in the range
    const current = new Date(dateFrom);
    current.setHours(0, 0, 0, 0);
    const end = new Date(dateTo);
    end.setHours(0, 0, 0, 0);

    while (current < end) {
      const dateStr = current.toISOString().split('T')[0]!;
      const dayOfWeek = current.getDay();

      // Skip holidays
      if (!holidayDates.has(dateStr)) {
        // Find schedules for this day of week
        const daySchedules = schedules.filter((s) => s.dayOfWeek === dayOfWeek);

        for (const schedule of daySchedules) {
          const slotDuration = schedule.slotDurationMinutes ?? 30;
          const [startHour, startMin] = schedule.startTime.split(':').map(Number);
          const [endHour, endMin] = schedule.endTime.split(':').map(Number);

          let slotTime = new Date(current);
          slotTime.setHours(startHour ?? 0, startMin ?? 0, 0, 0);

          const slotEnd = new Date(current);
          slotEnd.setHours(endHour ?? 0, endMin ?? 0, 0, 0);

          while (slotTime < slotEnd) {
            const slotTimeStr = this.formatTime(slotTime);
            const slotEndAt = new Date(slotTime.getTime() + slotDuration * 60000);

            // Check if this slot overlaps with any existing appointment
            const isOccupied = existingAppointments.some((apt) => {
              const aptStart = apt.startAt.getTime();
              const aptEnd = apt.endAt.getTime();
              const slotStart = slotTime.getTime();
              const slotEndMs = slotEndAt.getTime();
              return slotStart < aptEnd && slotEndMs > aptStart;
            });

            // Check if this slot falls within any exception
            const isException = exceptions.some((exc) => {
              if (exc.type === 'full_day') {
                return true;
              }
              if (exc.type === 'time_range' && exc.startTime && exc.endTime) {
                return slotTimeStr >= exc.startTime && slotTimeStr < exc.endTime;
              }
              return false;
            });

            slots.push({
              date: dateStr,
              time: slotTimeStr,
              isAvailable: !isOccupied && !isException,
            });

            slotTime = new Date(slotTime.getTime() + slotDuration * 60000);
          }
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return slots;
  }

  // ─── Patient-facing ────────────────────────────────────────────────────

  async findByPatient(patientId: string, tenantId: string): Promise<AppointmentListItem[]> {
    return this.repository.findByPatient(patientId, tenantId);
  }

  async findNextForPatient(
    phoneNumber: string,
    tenantId: string,
  ): Promise<AppointmentDetail | null> {
    return this.repository.findNextForPatient(phoneNumber, tenantId);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async logReschedule(
    appointmentId: string,
    previous: AppointmentDetail,
    tenantId: string,
    changedBy: string | null,
  ): Promise<void> {
    const db = this.dbService.db;

    await db.insert(appointmentAuditLog).values({
      tenantId,
      appointmentId,
      action: 'rescheduled',
      oldValues: {
        startAt: previous.startAt.toISOString(),
        endAt: previous.endAt.toISOString(),
        professionalId: previous.professionalId,
      },
      newValues: {
        startAt: previous.startAt.toISOString(),
        endAt: previous.endAt.toISOString(),
        professionalId: previous.professionalId,
      },
      changedBy,
      changedAt: new Date(),
    });
  }

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
