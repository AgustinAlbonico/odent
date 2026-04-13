import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DatabaseService } from '../../infra/database/database.service.js';
import { holidays } from '../../infra/database/schema.js';

export type AddHolidayInput = {
  date: string;
  name: string;
};

type ArgentinaDatoFeriado = {
  fecha: string;
  tipo: string;
  descripcion: string;
};

@Injectable()
export class HolidaysService {
  private readonly logger = new Logger(HolidaysService.name);

  constructor(private readonly dbService: DatabaseService) {}

  async findByTenant(tenantId: string, year?: number) {
    const db = this.dbService.db;

    const conditions = [
      eq(holidays.tenantId, tenantId),
      eq(holidays.isActive, true),
    ];

    if (year) {
      conditions.push(sql`EXTRACT(YEAR FROM ${holidays.date}) = ${year}`);
    }

    return db
      .select()
      .from(holidays)
      .where(and(...conditions))
      .orderBy(holidays.date);
  }

  async addInstitutional(input: AddHolidayInput, tenantId: string) {
    const db = this.dbService.db;

    // Check if already exists
    const dateStr = input.date;
    const existing = await db
      .select()
      .from(holidays)
      .where(
        and(
          eq(holidays.tenantId, tenantId),
          sql`${holidays.date}::date = ${dateStr}::date`,
          eq(holidays.isActive, true),
        ),
      );

    if (existing.length > 0) {
      throw new BadRequestException(
        `Ya existe un feriado para la fecha ${dateStr}.`,
      );
    }

    const [holiday] = await db
      .insert(holidays)
      .values({
        tenantId,
        date: new Date(input.date),
        name: input.name,
        type: 'institutional',
        isActive: true,
      })
      .returning();

    return holiday;
  }

  async syncFromArgentinaDatos(year: number, tenantId: string) {
    const logger = this.logger;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `https://api.argentinadatos.com/v1/feriados/${year}`,
        { signal: controller.signal },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        logger.warn(
          `ArgentinaDatos API returned ${response.status} for year ${year}`,
        );
        return { synced: 0, message: 'API no disponible.' };
      }

      const data = await response.json() as ArgentinaDatoFeriado[];
      let synced = 0;

      const db = this.dbService.db;

      for (const feriado of data) {
        const dateStr = feriado.fecha;
        const name = feriado.descripcion;

        // Upsert: check if exists by date+name
        const existing = await db
          .select()
          .from(holidays)
          .where(
            and(
              eq(holidays.tenantId, tenantId),
              sql`${holidays.date}::date = ${dateStr}::date`,
            ),
          );

        if (existing.length > 0) {
          // Update only 'national' type holidays, skip 'institutional'
          const existingHoliday = existing[0]!;
          if (existingHoliday.type === 'national') {
            await db
              .update(holidays)
              .set({ name, isActive: true })
              .where(eq(holidays.id, existingHoliday.id));
            synced++;
          }
          // institutional ones are left untouched
        } else {
          // Insert new
          await db.insert(holidays).values({
            tenantId,
            date: new Date(dateStr),
            name,
            type: 'national',
            isActive: true,
          });
          synced++;
        }
      }

      return { synced, year };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn(`Timeout syncing holidays for year ${year}`);
        return { synced: 0, message: 'Timeout al sincronizar feriados.' };
      }

      logger.warn(`Error syncing holidays for year ${year}: ${error}`);
      return { synced: 0, message: 'Error al sincronizar feriados.' };
    }
  }

  async isHoliday(date: Date, tenantId: string): Promise<boolean> {
    const db = this.dbService.db;
    const dateStr = date.toISOString().split('T')[0];

    const results = await db
      .select()
      .from(holidays)
      .where(
        and(
          eq(holidays.tenantId, tenantId),
          eq(holidays.isActive, true),
          sql`${holidays.date}::date = ${dateStr}::date`,
        ),
      );

    return results.length > 0;
  }
}
