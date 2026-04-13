import { Injectable } from '@nestjs/common';
import { eq, and, notInArray, lt, gt, ne, sql } from 'drizzle-orm';
import { DatabaseService } from '../../infra/database/database.service.js';
import {
  appointmentExceptions,
  appointments,
  holidays,
  appointmentSchedules,
} from '../../infra/database/schema.js';
import type { ConflictCheckResult, ConflictDetail } from './appointments.types.js';

@Injectable()
export class ConflictsService {
  constructor(private readonly dbService: DatabaseService) {}

  /**
   * Check all conflict conditions for a proposed appointment.
   * Returns hard blocks (must prevent creation) and soft warnings (can proceed with caution).
   */
  async checkConflicts(
    professionalId: string,
    startAt: Date,
    endAt: Date,
    tenantId: string,
    excludeAppointmentId?: string,
  ): Promise<ConflictCheckResult> {
    const hardBlocks: ConflictDetail[] = [];
    const softWarnings: ConflictDetail[] = [];

    hardBlocks.push(...(await this.checkExceptions(professionalId, startAt, endAt, tenantId)));
    hardBlocks.push(
      ...(await this.checkOverlap(professionalId, startAt, endAt, tenantId, excludeAppointmentId)),
    );
    softWarnings.push(...(await this.checkHoliday(startAt, tenantId)));
    softWarnings.push(
      ...(await this.checkOutsideHours(professionalId, startAt, endAt, tenantId)),
    );

    return { hardBlocks, softWarnings };
  }

  /**
   * Check if the professional has any active exception covering the proposed time range.
   */
  private async checkExceptions(
    professionalId: string,
    startAt: Date,
    endAt: Date,
    tenantId: string,
  ): Promise<ConflictDetail[]> {
    const db = this.dbService.db;
    const results: ConflictDetail[] = [];

    const exceptions = await db
      .select()
      .from(appointmentExceptions)
      .where(
        and(
          eq(appointmentExceptions.tenantId, tenantId),
          eq(appointmentExceptions.professionalId, professionalId),
          sql`${appointmentExceptions.startDate}::date <= ${startAt.toISOString().split('T')[0]}::date`,
          sql`${appointmentExceptions.endDate}::date >= ${startAt.toISOString().split('T')[0]}::date`,
        ),
      );

    for (const exc of exceptions) {
      if (exc.type === 'full_day') {
        results.push({
          type: 'exception',
          severity: 'hard',
          message: `El profesional tiene una excepción vigente: ${exc.reason}`,
        });
      } else if (exc.type === 'time_range' && exc.startTime && exc.endTime) {
        const proposedStart = this.formatTime(startAt);
        const proposedEnd = this.formatTime(endAt);

        // Check time overlap: proposedStart < excEnd AND proposedEnd > excStart
        if (proposedStart < exc.endTime && proposedEnd > exc.startTime) {
          results.push({
            type: 'exception',
            severity: 'hard',
            message: `El profesional tiene una excepción vigente: ${exc.reason}`,
          });
        }
      }
    }

    return results;
  }

  /**
   * Check if the professional already has an appointment overlapping the proposed time range.
   */
  private async checkOverlap(
    professionalId: string,
    startAt: Date,
    endAt: Date,
    tenantId: string,
    excludeId?: string,
  ): Promise<ConflictDetail[]> {
    const db = this.dbService.db;

    const conditions = [
      eq(appointments.tenantId, tenantId),
      eq(appointments.professionalId, professionalId),
      notInArray(appointments.status, ['cancelled', 'no_show']),
      lt(appointments.startAt, endAt),
      gt(appointments.endAt, startAt),
    ];

    if (excludeId) {
      conditions.push(ne(appointments.id, excludeId));
    }

    const overlapping = await db
      .select()
      .from(appointments)
      .where(and(...conditions));

    if (overlapping.length > 0) {
      return [
        {
          type: 'overlap',
          severity: 'hard',
          message: 'El profesional ya tiene un turno en ese horario',
        },
      ];
    }

    return [];
  }

  /**
   * Check if the proposed date is a holiday.
   */
  private async checkHoliday(date: Date, tenantId: string): Promise<ConflictDetail[]> {
    const db = this.dbService.db;
    const dateStr = date.toISOString().split('T')[0];

    const results: ConflictDetail[] = [];

    const holidayList = await db
      .select()
      .from(holidays)
      .where(
        and(
          eq(holidays.tenantId, tenantId),
          eq(holidays.isActive, true),
          sql`${holidays.date}::date = ${dateStr}::date`,
        ),
      );

    for (const holiday of holidayList) {
      results.push({
        type: 'holiday',
        severity: 'soft',
        message: `La fecha seleccionada es feriado: ${holiday.name}. ¿Desea continuar?`,
      });
    }

    return results;
  }

  /**
   * Check if the proposed time falls outside the professional's regular working hours.
   */
  private async checkOutsideHours(
    professionalId: string,
    startAt: Date,
    endAt: Date,
    tenantId: string,
  ): Promise<ConflictDetail[]> {
    const db = this.dbService.db;
    const dayOfWeek = startAt.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const proposedStart = this.formatTime(startAt);
    const proposedEnd = this.formatTime(endAt);

    const schedules = await db
      .select()
      .from(appointmentSchedules)
      .where(
        and(
          eq(appointmentSchedules.tenantId, tenantId),
          eq(appointmentSchedules.professionalId, professionalId),
          eq(appointmentSchedules.dayOfWeek, dayOfWeek),
          eq(appointmentSchedules.isActive, true),
        ),
      );

    // Check if the proposed time falls within ANY active schedule range
    const isWithinHours = schedules.some(
      (s) => proposedStart >= s.startTime && proposedEnd <= s.endTime,
    );

    if (!isWithinHours) {
      return [
        {
          type: 'outside_hours',
          severity: 'soft',
          message: 'El horario está fuera del horario habitual del profesional',
        },
      ];
    }

    return [];
  }

  /**
   * Format a Date as "HH:MM" string for time comparisons.
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
