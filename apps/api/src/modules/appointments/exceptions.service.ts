import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { DatabaseService } from '../../infra/database/database.service.js';
import { appointmentExceptions } from '../../infra/database/schema.js';

export type CreateExceptionInput = {
  professionalId: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason: string;
  type: 'full_day' | 'time_range';
};

@Injectable()
export class ExceptionsService {
  constructor(private readonly dbService: DatabaseService) {}

  async findAll(tenantId: string, dateFrom?: string, dateTo?: string) {
    const db = this.dbService.db;

    const conditions = [eq(appointmentExceptions.tenantId, tenantId)];

    if (dateFrom) {
      conditions.push(sql`${appointmentExceptions.endDate}::date >= ${dateFrom}::date`);
    }
    if (dateTo) {
      conditions.push(sql`${appointmentExceptions.startDate}::date <= ${dateTo}::date`);
    }

    return db
      .select()
      .from(appointmentExceptions)
      .where(and(...conditions))
      .orderBy(appointmentExceptions.startDate);
  }

  async create(input: CreateExceptionInput, tenantId: string) {
    this.validateDates(input.startDate, input.endDate);
    this.validateType(input.type, input.startTime, input.endTime);

    const db = this.dbService.db;

    // Check for overlapping exceptions
    const overlapping = await db
      .select()
      .from(appointmentExceptions)
      .where(
        and(
          eq(appointmentExceptions.tenantId, tenantId),
          eq(appointmentExceptions.professionalId, input.professionalId),
          sql`${appointmentExceptions.startDate}::date <= ${input.endDate}::date`,
          sql`${appointmentExceptions.endDate}::date >= ${input.startDate}::date`,
        ),
      );

    if (overlapping.length > 0) {
      // For time_range exceptions, check if they overlap in time on shared dates
      if (input.type === 'time_range' && input.startTime && input.endTime) {
        const hasTimeOverlap = overlapping.some((exc) => {
          if (exc.type === 'full_day') return true;
          if (exc.type === 'time_range' && exc.startTime && exc.endTime) {
            return input.startTime! < exc.endTime && input.endTime! > exc.startTime;
          }
          return false;
        });
        if (hasTimeOverlap) {
          throw new BadRequestException(
            'Ya existe una excepción que se superpone con este rango de fechas y horario.',
          );
        }
      } else {
        throw new BadRequestException(
          'Ya existe una excepción que se superpone con este rango de fechas.',
        );
      }
    }

    const [exception] = await db
      .insert(appointmentExceptions)
      .values({
        tenantId,
        professionalId: input.professionalId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        reason: input.reason,
        type: input.type,
      })
      .returning();

    return exception;
  }

  async findByProfessional(
    professionalId: string,
    tenantId: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const db = this.dbService.db;

    const conditions = [
      eq(appointmentExceptions.tenantId, tenantId),
      eq(appointmentExceptions.professionalId, professionalId),
    ];

    if (dateFrom) {
      conditions.push(sql`${appointmentExceptions.endDate}::date >= ${dateFrom}::date`);
    }
    if (dateTo) {
      conditions.push(sql`${appointmentExceptions.startDate}::date <= ${dateTo}::date`);
    }

    return db
      .select()
      .from(appointmentExceptions)
      .where(and(...conditions))
      .orderBy(appointmentExceptions.startDate);
  }

  async delete(id: string, tenantId: string) {
    const db = this.dbService.db;

    const existing = await db
      .select()
      .from(appointmentExceptions)
      .where(
        and(
          eq(appointmentExceptions.id, id),
          eq(appointmentExceptions.tenantId, tenantId),
        ),
      );

    if (existing.length === 0) {
      throw new NotFoundException('Excepción no encontrada.');
    }

    await db
      .delete(appointmentExceptions)
      .where(eq(appointmentExceptions.id, id));

    return { id, deleted: true };
  }

  async isActiveForDate(professionalId: string, date: Date, tenantId: string): Promise<boolean> {
    const db = this.dbService.db;
    const dateStr = date.toISOString().split('T')[0];

    const exceptions = await db
      .select()
      .from(appointmentExceptions)
      .where(
        and(
          eq(appointmentExceptions.tenantId, tenantId),
          eq(appointmentExceptions.professionalId, professionalId),
          sql`${appointmentExceptions.startDate}::date <= ${dateStr}::date`,
          sql`${appointmentExceptions.endDate}::date >= ${dateStr}::date`,
        ),
      );

    return exceptions.length > 0;
  }

  private validateDates(startDate: string, endDate: string) {
    if (startDate > endDate) {
      throw new BadRequestException('startDate debe ser menor o igual que endDate.');
    }
  }

  private validateType(
    type: 'full_day' | 'time_range',
    startTime?: string,
    endTime?: string,
  ) {
    if (type === 'time_range' && (!startTime || !endTime)) {
      throw new BadRequestException(
        'Para excepciones de tipo "time_range", startTime y endTime son obligatorios.',
      );
    }
  }
}
