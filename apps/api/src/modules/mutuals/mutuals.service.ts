import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, ilike, or, asc, type SQL } from 'drizzle-orm';
import { DatabaseService } from '../../infra/database/database.service.js';
import { mutuals, professionalMutuals } from '../../infra/database/schema.js';

// ─── Mutual Catalog Types ────────────────────────────────

export interface CreateMutualInput {
  name: string;
  code: string;
  phone?: string;
}

export interface UpdateMutualInput {
  name?: string;
  code?: string;
  phone?: string;
}

export interface ListMutualsFilters {
  search?: string;
  includeInactive?: boolean;
  page: number;
  limit: number;
}

export interface MutualItem {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedMutualsResult {
  data: MutualItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Professional-Mutual Types ───────────────────────────

export interface ProfessionalMutualItem {
  id: string;
  professionalId: string;
  mutualId: string;
  mutualName: string;
  mutualCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MutualsService {
  constructor(private readonly dbService: DatabaseService) {}

  // ─── Mutual Catalog CRUD ──────────────────────────────

  async listMutuals(
    filters: ListMutualsFilters,
    tenantId: string,
  ): Promise<PaginatedMutualsResult> {
    const db = this.dbService.db;

    const whereConditions: (SQL | undefined)[] = [];

    whereConditions.push(eq(mutuals.tenantId, tenantId));

    if (!filters.includeInactive) {
      whereConditions.push(eq(mutuals.isActive, true));
    }

    if (filters.search?.trim()) {
      const search = filters.search.trim();
      whereConditions.push(
        or(ilike(mutuals.name, `%${search}%`), ilike(mutuals.code, `%${search}%`)),
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const countResult = await db.select({ total: count() }).from(mutuals).where(whereClause);
    const total = countResult[0]?.total ?? 0;

    const offset = (filters.page - 1) * filters.limit;

    const rows = await db
      .select({
        id: mutuals.id,
        name: mutuals.name,
        code: mutuals.code,
        phone: mutuals.phone,
        isActive: mutuals.isActive,
        createdAt: mutuals.createdAt,
        updatedAt: mutuals.updatedAt,
      })
      .from(mutuals)
      .where(whereClause)
      .orderBy(asc(mutuals.name))
      .limit(filters.limit)
      .offset(offset);

    const totalPages = Math.max(1, Math.ceil(total / filters.limit));

    return {
      data: rows,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages,
    };
  }

  async getMutualById(mutualId: string, tenantId: string): Promise<MutualItem> {
    const db = this.dbService.db;

    const rows = await db
      .select()
      .from(mutuals)
      .where(and(eq(mutuals.id, mutualId), eq(mutuals.tenantId, tenantId)))
      .limit(1);

    const mutual = rows[0];
    if (!mutual) {
      throw new NotFoundException({
        code: 'mutual_not_found',
        message: 'Mutual no encontrada.',
      });
    }

    return mutual;
  }

  async createMutual(input: CreateMutualInput, tenantId: string): Promise<MutualItem> {
    const db = this.dbService.db;

    // Validate unique name
    const existingName = await db
      .select({ id: mutuals.id })
      .from(mutuals)
      .where(and(eq(mutuals.name, input.name.trim()), eq(mutuals.tenantId, tenantId)))
      .limit(1);

    if (existingName[0]) {
      throw new ConflictException({
        code: 'duplicate_mutual_name',
        message: 'Ya existe una mutual con ese nombre.',
      });
    }

    // Validate unique code
    const existingCode = await db
      .select({ id: mutuals.id })
      .from(mutuals)
      .where(and(eq(mutuals.code, input.code.trim()), eq(mutuals.tenantId, tenantId)))
      .limit(1);

    if (existingCode[0]) {
      throw new ConflictException({
        code: 'duplicate_mutual_code',
        message: 'Ya existe una mutual con ese código.',
      });
    }

    const now = new Date();
    const [created] = await db
      .insert(mutuals)
      .values({
        tenantId,
        name: input.name.trim(),
        code: input.code.trim(),
        phone: input.phone?.trim() || null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!created) {
      throw new Error('Mutual creation did not return a row');
    }

    return created;
  }

  async updateMutual(
    mutualId: string,
    input: UpdateMutualInput,
    tenantId: string,
  ): Promise<MutualItem> {
    const db = this.dbService.db;

    const existing = await db
      .select({ id: mutuals.id, name: mutuals.name, code: mutuals.code })
      .from(mutuals)
      .where(and(eq(mutuals.id, mutualId), eq(mutuals.tenantId, tenantId)))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException({
        code: 'mutual_not_found',
        message: 'Mutual no encontrada.',
      });
    }

    // Validate unique name if changed
    if (input.name !== undefined && input.name.trim() !== existing[0].name) {
      const conflict = await db
        .select({ id: mutuals.id })
        .from(mutuals)
        .where(and(eq(mutuals.name, input.name.trim()), eq(mutuals.tenantId, tenantId)))
        .limit(1);

      if (conflict[0] && conflict[0].id !== mutualId) {
        throw new ConflictException({
          code: 'duplicate_mutual_name',
          message: 'Ya existe otra mutual con ese nombre.',
        });
      }
    }

    // Validate unique code if changed
    if (input.code !== undefined && input.code.trim() !== existing[0].code) {
      const conflict = await db
        .select({ id: mutuals.id })
        .from(mutuals)
        .where(and(eq(mutuals.code, input.code.trim()), eq(mutuals.tenantId, tenantId)))
        .limit(1);

      if (conflict[0] && conflict[0].id !== mutualId) {
        throw new ConflictException({
          code: 'duplicate_mutual_code',
          message: 'Ya existe otra mutual con ese código.',
        });
      }
    }

    const [updated] = await db
      .update(mutuals)
      .set({
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.code !== undefined && { code: input.code.trim() }),
        ...(input.phone !== undefined && { phone: input.phone?.trim() || null }),
        updatedAt: new Date(),
      })
      .where(and(eq(mutuals.id, mutualId), eq(mutuals.tenantId, tenantId)))
      .returning();

    if (!updated) {
      throw new Error('Mutual update did not return a row');
    }

    return updated;
  }

  async softDeleteMutual(mutualId: string, tenantId: string): Promise<MutualItem> {
    const db = this.dbService.db;

    const existing = await db
      .select({ id: mutuals.id, isActive: mutuals.isActive })
      .from(mutuals)
      .where(and(eq(mutuals.id, mutualId), eq(mutuals.tenantId, tenantId)))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException({
        code: 'mutual_not_found',
        message: 'Mutual no encontrada.',
      });
    }

    if (!existing[0].isActive) {
      throw new ConflictException({
        code: 'mutual_already_inactive',
        message: 'La mutual ya se encuentra inactiva.',
      });
    }

    const [updated] = await db
      .update(mutuals)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(mutuals.id, mutualId), eq(mutuals.tenantId, tenantId)))
      .returning();

    if (!updated) {
      throw new Error('Mutual soft delete did not return a row');
    }

    return updated;
  }

  // ─── Professional-Mutual Operations ───────────────────

  async getProfessionalMutuals(
    professionalId: string,
    tenantId: string,
  ): Promise<ProfessionalMutualItem[]> {
    const db = this.dbService.db;

    return db
      .select({
        id: professionalMutuals.id,
        professionalId: professionalMutuals.professionalId,
        mutualId: professionalMutuals.mutualId,
        mutualName: mutuals.name,
        mutualCode: mutuals.code,
        isActive: professionalMutuals.isActive,
        createdAt: professionalMutuals.createdAt,
        updatedAt: professionalMutuals.updatedAt,
      })
      .from(professionalMutuals)
      .innerJoin(mutuals, eq(professionalMutuals.mutualId, mutuals.id))
      .where(
        and(
          eq(professionalMutuals.professionalId, professionalId),
          eq(professionalMutuals.isActive, true),
          eq(professionalMutuals.tenantId, tenantId),
        ),
      )
      .orderBy(asc(mutuals.name));
  }

  async addProfessionalMutual(
    professionalId: string,
    mutualId: string,
    tenantId: string,
  ): Promise<ProfessionalMutualItem> {
    const db = this.dbService.db;

    // Verify mutual exists and is active
    const mutualRows = await db
      .select({ id: mutuals.id, isActive: mutuals.isActive })
      .from(mutuals)
      .where(and(eq(mutuals.id, mutualId), eq(mutuals.tenantId, tenantId)))
      .limit(1);

    if (!mutualRows[0]) {
      throw new NotFoundException({
        code: 'mutual_not_found',
        message: 'Mutual no encontrada.',
      });
    }

    if (!mutualRows[0].isActive) {
      throw new ConflictException({
        code: 'mutual_inactive',
        message: 'La mutual se encuentra inactiva.',
      });
    }

    // Check if already exists (active or inactive)
    const existing = await db
      .select({
        id: professionalMutuals.id,
        isActive: professionalMutuals.isActive,
      })
      .from(professionalMutuals)
      .where(
        and(
          eq(professionalMutuals.professionalId, professionalId),
          eq(professionalMutuals.mutualId, mutualId),
          eq(professionalMutuals.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (existing[0]) {
      if (existing[0].isActive) {
        throw new ConflictException({
          code: 'professional_mutual_already_exists',
          message: 'La mutual ya está asignada a este profesional.',
        });
      }

      // Reactivate existing inactive record
      const [reactivated] = await db
        .update(professionalMutuals)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(professionalMutuals.id, existing[0].id))
        .returning();

      // Fetch with mutual name/code
      const result = await db
        .select({
          id: professionalMutuals.id,
          professionalId: professionalMutuals.professionalId,
          mutualId: professionalMutuals.mutualId,
          mutualName: mutuals.name,
          mutualCode: mutuals.code,
          isActive: professionalMutuals.isActive,
          createdAt: professionalMutuals.createdAt,
          updatedAt: professionalMutuals.updatedAt,
        })
        .from(professionalMutuals)
        .innerJoin(mutuals, eq(professionalMutuals.mutualId, mutuals.id))
        .where(eq(professionalMutuals.id, reactivated!.id))
        .limit(1);

      return result[0]!;
    }

    // Create new
    const now = new Date();
    const [created] = await db
      .insert(professionalMutuals)
      .values({
        tenantId,
        professionalId,
        mutualId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!created) {
      throw new Error('Professional mutual creation did not return a row');
    }

    // Fetch with mutual name/code
    const result = await db
      .select({
        id: professionalMutuals.id,
        professionalId: professionalMutuals.professionalId,
        mutualId: professionalMutuals.mutualId,
        mutualName: mutuals.name,
        mutualCode: mutuals.code,
        isActive: professionalMutuals.isActive,
        createdAt: professionalMutuals.createdAt,
        updatedAt: professionalMutuals.updatedAt,
      })
      .from(professionalMutuals)
      .innerJoin(mutuals, eq(professionalMutuals.mutualId, mutuals.id))
      .where(eq(professionalMutuals.id, created.id))
      .limit(1);

    return result[0]!;
  }

  async removeProfessionalMutual(
    professionalId: string,
    mutualId: string,
    tenantId: string,
  ): Promise<void> {
    const db = this.dbService.db;

    const existing = await db
      .select({
        id: professionalMutuals.id,
        isActive: professionalMutuals.isActive,
      })
      .from(professionalMutuals)
      .where(
        and(
          eq(professionalMutuals.professionalId, professionalId),
          eq(professionalMutuals.mutualId, mutualId),
          eq(professionalMutuals.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException({
        code: 'professional_mutual_not_found',
        message: 'Mutual no encontrada para este profesional.',
      });
    }

    if (!existing[0].isActive) {
      throw new ConflictException({
        code: 'professional_mutual_already_removed',
        message: 'La mutual ya fue removida de este profesional.',
      });
    }

    await db
      .update(professionalMutuals)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(professionalMutuals.id, existing[0].id));
  }
}
