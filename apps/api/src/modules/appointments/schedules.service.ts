import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql, lt, gt } from 'drizzle-orm';
import { DatabaseService } from '../../infra/database/database.service.js';
import { appointmentSchedules } from '../../infra/database/schema.js';

export type CreateScheduleInput = {
  professionalId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
};

export type UpdateScheduleInput = Partial<CreateScheduleInput>;

@Injectable()
export class SchedulesService {
  constructor(private readonly dbService: DatabaseService) {}

  async findAll(tenantId: string) {
    const db = this.dbService.db;

    return db
      .select()
      .from(appointmentSchedules)
      .where(
        and(
          eq(appointmentSchedules.tenantId, tenantId),
          eq(appointmentSchedules.isActive, true),
        ),
      )
      .orderBy(
        appointmentSchedules.professionalId,
        appointmentSchedules.dayOfWeek,
        appointmentSchedules.startTime,
      );
  }

  async create(input: CreateScheduleInput, tenantId: string) {
    this.validateDayOfWeek(input.dayOfWeek);
    this.validateTimeRange(input.startTime, input.endTime);

    const db = this.dbService.db;

    // Check for overlapping schedules: same professional + same day + time range overlap
    // Overlap condition: newStart < existingEnd AND newEnd > existingStart
    const overlapping = await db
      .select()
      .from(appointmentSchedules)
      .where(
        and(
          eq(appointmentSchedules.tenantId, tenantId),
          eq(appointmentSchedules.professionalId, input.professionalId),
          eq(appointmentSchedules.dayOfWeek, input.dayOfWeek),
          eq(appointmentSchedules.isActive, true),
          lt(appointmentSchedules.startTime, input.endTime),
          gt(appointmentSchedules.endTime, input.startTime),
        ),
      );

    if (overlapping.length > 0) {
      throw new BadRequestException(
        'Ya existe un horario que se superpone con el rango ingresado para este profesional en ese día.',
      );
    }

    const [schedule] = await db
      .insert(appointmentSchedules)
      .values({
        tenantId,
        professionalId: input.professionalId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        slotDurationMinutes: input.slotDurationMinutes,
        isActive: true,
      })
      .returning();

    return schedule;
  }

  async findByProfessional(professionalId: string, tenantId: string) {
    const db = this.dbService.db;

    return db
      .select()
      .from(appointmentSchedules)
      .where(
        and(
          eq(appointmentSchedules.tenantId, tenantId),
          eq(appointmentSchedules.professionalId, professionalId),
          eq(appointmentSchedules.isActive, true),
        ),
      )
      .orderBy(appointmentSchedules.dayOfWeek, appointmentSchedules.startTime);
  }

  async update(id: string, input: UpdateScheduleInput, tenantId: string) {
    const db = this.dbService.db;

    const existing = await db
      .select()
      .from(appointmentSchedules)
      .where(
        and(
          eq(appointmentSchedules.id, id),
          eq(appointmentSchedules.tenantId, tenantId),
        ),
      );

    if (existing.length === 0) {
      throw new NotFoundException('Horario no encontrado.');
    }

    const current = existing[0]!;

    if (input.dayOfWeek !== undefined) {
      this.validateDayOfWeek(input.dayOfWeek);
    }

    const startTime = input.startTime ?? current.startTime;
    const endTime = input.endTime ?? current.endTime;

    if (input.startTime || input.endTime) {
      this.validateTimeRange(startTime, endTime);
    }

    // Check for overlapping schedules if day/time changed
    if (input.dayOfWeek !== undefined || input.startTime || input.endTime) {
      const dayOfWeek = input.dayOfWeek ?? current.dayOfWeek;
      const startTime = input.startTime ?? current.startTime;
      const endTime = input.endTime ?? current.endTime;

      // Overlap condition: newStart < existingEnd AND newEnd > existingStart
      const overlapping = await db
        .select()
        .from(appointmentSchedules)
        .where(
          and(
            eq(appointmentSchedules.tenantId, tenantId),
            eq(appointmentSchedules.professionalId, current.professionalId),
            eq(appointmentSchedules.dayOfWeek, dayOfWeek),
            eq(appointmentSchedules.isActive, true),
            lt(appointmentSchedules.startTime, endTime),
            gt(appointmentSchedules.endTime, startTime),
            sql`${appointmentSchedules.id} != ${id}`,
          ),
        );

      if (overlapping.length > 0) {
        throw new BadRequestException(
          'Ya existe un horario que se superpone con el rango ingresado para este profesional en ese día.',
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (input.dayOfWeek !== undefined) updateData.dayOfWeek = input.dayOfWeek;
    if (input.startTime) updateData.startTime = input.startTime;
    if (input.endTime) updateData.endTime = input.endTime;
    if (input.slotDurationMinutes !== undefined) updateData.slotDurationMinutes = input.slotDurationMinutes;

    const [updated] = await db
      .update(appointmentSchedules)
      .set(updateData)
      .where(eq(appointmentSchedules.id, id))
      .returning();

    return updated;
  }

  async delete(id: string, tenantId: string) {
    const db = this.dbService.db;

    const existing = await db
      .select()
      .from(appointmentSchedules)
      .where(
        and(
          eq(appointmentSchedules.id, id),
          eq(appointmentSchedules.tenantId, tenantId),
        ),
      );

    if (existing.length === 0) {
      throw new NotFoundException('Horario no encontrado.');
    }

    // Soft delete
    await db
      .update(appointmentSchedules)
      .set({ isActive: false })
      .where(eq(appointmentSchedules.id, id));

    return { id, deleted: true };
  }

  async getWeeklySchedule(professionalId: string, tenantId: string) {
    const schedules = await this.findByProfessional(professionalId, tenantId);

    // Group by day of week
    const weekly: Record<number, typeof schedules> = {};

    for (const schedule of schedules) {
      const day = schedule.dayOfWeek;
      if (!weekly[day]) {
        weekly[day] = [];
      }
      weekly[day].push(schedule);
    }

    return weekly;
  }

  private validateDayOfWeek(dayOfWeek: number) {
    if (dayOfWeek < 0 || dayOfWeek > 6 || !Number.isInteger(dayOfWeek)) {
      throw new BadRequestException(
        'dayOfWeek debe ser un entero entre 0 (domingo) y 6 (sábado).',
      );
    }
  }

  private validateTimeRange(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException(
        'startTime debe ser menor que endTime.',
      );
    }
  }
}
