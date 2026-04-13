import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, ilike, or, asc, type SQL } from 'drizzle-orm';
import { DatabaseService } from '../../infra/database/database.service.js';
import { patients, patientMutuals, mutuals } from '../../infra/database/schema.js';

export type PatientSex = 'male' | 'female' | 'other';
export type BloodGroup = 'A' | 'B' | 'AB' | 'O';
export type RhFactor = 'positive' | 'negative';

export interface CreatePatientInput {
  dni?: string;
  firstName: string;
  lastName: string;
  sex?: PatientSex;
  birthDate?: Date;
  bloodGroup?: BloodGroup;
  rhFactor?: RhFactor;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  notes?: string;
}

export interface UpdatePatientInput {
  dni?: string;
  firstName?: string;
  lastName?: string;
  sex?: PatientSex;
  birthDate?: Date;
  bloodGroup?: BloodGroup;
  rhFactor?: RhFactor;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  notes?: string;
}

export interface ListPatientsFilters {
  search?: string;
  state?: 'active' | 'inactive';
  page: number;
  limit: number;
}

export interface PatientListItem {
  id: string;
  dni: string | null;
  firstName: string;
  lastName: string;
  sex: PatientSex | null;
  email: string | null;
  phone: string | null;
  birthDate: Date | null;
  state: 'active' | 'inactive';
  createdAt: Date;
}

export interface PatientDetail extends PatientListItem {
  bloodGroup: BloodGroup | null;
  rhFactor: RhFactor | null;
  address: string | null;
  postalCode: string | null;
  notes: string | null;
  updatedAt: Date;
}

export interface CreatePatientMutualInput {
  mutualId: string;
  planName?: string;
  affiliateNumber: string;
  coveragePercent: number;
  isActive: boolean;
}

export interface PatientMutualItem {
  id: string;
  patientId: string;
  mutualId: string | null;
  mutualName: string;
  mutualCode: string;
  planName: string | null;
  affiliateNumber: string;
  coveragePercent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedPatientsResult {
  data: PatientListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PatientsService {
  constructor(private readonly dbService: DatabaseService) {}

  async listPatients(
    filters: ListPatientsFilters,
    tenantId: string,
  ): Promise<PaginatedPatientsResult> {
    const db = this.dbService.db;

    const whereConditions: (SQL | undefined)[] = [];

    whereConditions.push(eq(patients.tenantId, tenantId));

    if (filters.state) {
      whereConditions.push(eq(patients.state, filters.state));
    }

    if (filters.search?.trim()) {
      const search = filters.search.trim();
      whereConditions.push(
        or(
          ilike(patients.dni, `%${search}%`),
          ilike(patients.firstName, `%${search}%`),
          ilike(patients.lastName, `%${search}%`),
        ),
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const countResult = await db.select({ total: count() }).from(patients).where(whereClause);
    const total = countResult[0]?.total ?? 0;

    const offset = (filters.page - 1) * filters.limit;

    const rows = await db
      .select({
        id: patients.id,
        dni: patients.dni,
        firstName: patients.firstName,
        lastName: patients.lastName,
        sex: patients.sex,
        email: patients.email,
        phone: patients.phone,
        birthDate: patients.birthDate,
        state: patients.state,
        createdAt: patients.createdAt,
      })
      .from(patients)
      .where(whereClause)
      .orderBy(asc(patients.lastName), asc(patients.firstName))
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

  async getPatientById(patientId: string, tenantId: string): Promise<PatientDetail> {
    const db = this.dbService.db;

    const rows = await db
      .select()
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.tenantId, tenantId)))
      .limit(1);

    const patient = rows[0];
    if (!patient) {
      throw new NotFoundException({
        code: 'patient_not_found',
        message: 'Paciente no encontrado.',
      });
    }

    return patient;
  }

  async createPatient(input: CreatePatientInput, tenantId: string): Promise<PatientDetail> {
    const db = this.dbService.db;

    // Validate DNI uniqueness across ALL patients (active + inactive) within the same tenant
    if (input.dni?.trim()) {
      const existing = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.dni, input.dni.trim()), eq(patients.tenantId, tenantId)))
        .limit(1);

      if (existing[0]) {
        throw new ConflictException({
          code: 'duplicate_dni',
          message: 'Ya existe un paciente con ese DNI.',
        });
      }
    }

    const now = new Date();
    const [created] = await db
      .insert(patients)
      .values({
        tenantId,
        dni: input.dni?.trim() || null,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        sex: input.sex || null,
        birthDate: input.birthDate || null,
        bloodGroup: input.bloodGroup || null,
        rhFactor: input.rhFactor || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        postalCode: input.postalCode?.trim() || null,
        notes: input.notes?.trim() || null,
        state: 'active',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!created) {
      throw new Error('Patient creation did not return a row');
    }

    return created;
  }

  async updatePatient(
    patientId: string,
    input: UpdatePatientInput,
    tenantId: string,
  ): Promise<PatientDetail> {
    const db = this.dbService.db;

    const existing = await db
      .select({ id: patients.id, dni: patients.dni })
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.tenantId, tenantId)))
      .limit(1);

    if (!existing[0]) {
      throw new NotFoundException({
        code: 'patient_not_found',
        message: 'Paciente no encontrado.',
      });
    }

    // Validate DNI uniqueness if changed — check ALL patients within the same tenant
    if (input.dni !== undefined && input.dni?.trim() && input.dni.trim() !== existing[0].dni) {
      const conflict = await db
        .select({ id: patients.id })
        .from(patients)
        .where(and(eq(patients.dni, input.dni.trim()), eq(patients.tenantId, tenantId)))
        .limit(1);

      if (conflict[0] && conflict[0].id !== patientId) {
        throw new ConflictException({
          code: 'duplicate_dni',
          message: 'Ya existe otro paciente con ese DNI.',
        });
      }
    }

    const [updated] = await db
      .update(patients)
      .set({
        ...(input.dni !== undefined && { dni: input.dni?.trim() || null }),
        ...(input.firstName !== undefined && { firstName: input.firstName.trim() }),
        ...(input.lastName !== undefined && { lastName: input.lastName.trim() }),
        ...(input.sex !== undefined && { sex: input.sex }),
        ...(input.birthDate !== undefined && { birthDate: input.birthDate || null }),
        ...(input.bloodGroup !== undefined && { bloodGroup: input.bloodGroup || null }),
        ...(input.rhFactor !== undefined && { rhFactor: input.rhFactor || null }),
        ...(input.email !== undefined && { email: input.email?.trim() || null }),
        ...(input.phone !== undefined && { phone: input.phone?.trim() || null }),
        ...(input.address !== undefined && { address: input.address?.trim() || null }),
        ...(input.postalCode !== undefined && { postalCode: input.postalCode?.trim() || null }),
        ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
        updatedAt: new Date(),
      })
      .where(and(eq(patients.id, patientId), eq(patients.tenantId, tenantId)))
      .returning();

    if (!updated) {
      throw new Error('Patient update did not return a row');
    }

    return updated;
  }

  async changePatientState(
    patientId: string,
    state: 'active' | 'inactive',
    tenantId: string,
  ): Promise<PatientDetail> {
    const db = this.dbService.db;

    const rows = await db
      .select()
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.tenantId, tenantId)))
      .limit(1);

    const existing = rows[0];
    if (!existing) {
      throw new NotFoundException({
        code: 'patient_not_found',
        message: 'Paciente no encontrado.',
      });
    }

    if (existing.state === state) {
      throw new ConflictException({
        code: 'state_unchanged',
        message: `El paciente ya se encuentra en estado "${state}".`,
      });
    }

    const [updated] = await db
      .update(patients)
      .set({ state, updatedAt: new Date() })
      .where(and(eq(patients.id, patientId), eq(patients.tenantId, tenantId)))
      .returning();

    if (!updated) {
      throw new Error('Patient state change did not return a row');
    }

    return updated;
  }

  async getPatientMutuals(patientId: string, tenantId: string): Promise<PatientMutualItem[]> {
    const db = this.dbService.db;

    const patientRows = await db
      .select({ id: patients.id })
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.tenantId, tenantId)))
      .limit(1);

    if (!patientRows[0]) {
      throw new NotFoundException({
        code: 'patient_not_found',
        message: 'Paciente no encontrado.',
      });
    }

    return db
      .select({
        id: patientMutuals.id,
        patientId: patientMutuals.patientId,
        mutualId: patientMutuals.mutualId,
        mutualName: mutuals.name,
        mutualCode: mutuals.code,
        planName: patientMutuals.planName,
        affiliateNumber: patientMutuals.affiliateNumber,
        coveragePercent: patientMutuals.coveragePercent,
        isActive: patientMutuals.isActive,
        createdAt: patientMutuals.createdAt,
        updatedAt: patientMutuals.updatedAt,
      })
      .from(patientMutuals)
      .innerJoin(mutuals, eq(patientMutuals.mutualId, mutuals.id))
      .where(and(eq(patientMutuals.patientId, patientId), eq(patientMutuals.isActive, true)))
      .orderBy(desc(patientMutuals.createdAt));
  }

  async addPatientMutual(
    patientId: string,
    input: CreatePatientMutualInput,
    tenantId: string,
  ): Promise<PatientMutualItem> {
    const db = this.dbService.db;

    const patientRows = await db
      .select({ id: patients.id })
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.tenantId, tenantId)))
      .limit(1);

    if (!patientRows[0]) {
      throw new NotFoundException({
        code: 'patient_not_found',
        message: 'Paciente no encontrado.',
      });
    }

    // Verify mutual exists and is active
    const mutualRows = await db
      .select({
        id: mutuals.id,
        name: mutuals.name,
        code: mutuals.code,
        isActive: mutuals.isActive,
      })
      .from(mutuals)
      .where(and(eq(mutuals.id, input.mutualId), eq(mutuals.tenantId, tenantId)))
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

    const now = new Date();
    const [created] = await db
      .insert(patientMutuals)
      .values({
        patientId,
        mutualId: input.mutualId as string | null,
        mutualName: mutualRows[0].name,
        planName: input.planName?.trim() ?? '',
        affiliateNumber: input.affiliateNumber.trim(),
        coveragePercent: input.coveragePercent,
        isActive: input.isActive,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!created) {
      throw new Error('Patient mutual creation did not return a row');
    }

    // Fetch with mutual name/code via join
    const result = await db
      .select({
        id: patientMutuals.id,
        patientId: patientMutuals.patientId,
        mutualId: patientMutuals.mutualId,
        mutualName: mutuals.name,
        mutualCode: mutuals.code,
        planName: patientMutuals.planName,
        affiliateNumber: patientMutuals.affiliateNumber,
        coveragePercent: patientMutuals.coveragePercent,
        isActive: patientMutuals.isActive,
        createdAt: patientMutuals.createdAt,
        updatedAt: patientMutuals.updatedAt,
      })
      .from(patientMutuals)
      .innerJoin(mutuals, eq(patientMutuals.mutualId, mutuals.id))
      .where(eq(patientMutuals.id, created.id))
      .limit(1);

    return result[0]!;
  }

  async removePatientMutual(patientId: string, mutualId: string, tenantId: string): Promise<void> {
    const db = this.dbService.db;

    const mutual = await db
      .select({
        id: patientMutuals.id,
        patientId: patientMutuals.patientId,
        isActive: patientMutuals.isActive,
      })
      .from(patientMutuals)
      .where(eq(patientMutuals.id, mutualId))
      .limit(1);

    if (!mutual[0] || mutual[0].patientId !== patientId) {
      throw new NotFoundException({
        code: 'mutual_not_found',
        message: 'Obra social no encontrada para este paciente.',
      });
    }

    if (!mutual[0].isActive) {
      throw new ConflictException({
        code: 'mutual_already_removed',
        message: 'La obra social ya fue removida.',
      });
    }

    await db
      .update(patientMutuals)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(patientMutuals.id, mutualId));
  }

  async updatePatientMutual(
    patientId: string,
    mutualLinkId: string,
    input: {
      planName?: string;
      affiliateNumber?: string;
      coveragePercent?: number;
      isActive?: boolean;
    },
    tenantId: string,
  ): Promise<PatientMutualItem> {
    const db = this.dbService.db;

    const existing = await db
      .select({
        id: patientMutuals.id,
        patientId: patientMutuals.patientId,
      })
      .from(patientMutuals)
      .where(eq(patientMutuals.id, mutualLinkId))
      .limit(1);

    if (!existing[0] || existing[0].patientId !== patientId) {
      throw new NotFoundException({
        code: 'mutual_not_found',
        message: 'Obra social no encontrada para este paciente.',
      });
    }

    const [updated] = await db
      .update(patientMutuals)
      .set({
        ...(input.planName !== undefined && {
          planName: input.planName?.trim() ?? '',
        }),
        ...(input.affiliateNumber !== undefined && {
          affiliateNumber: input.affiliateNumber.trim(),
        }),
        ...(input.coveragePercent !== undefined && {
          coveragePercent: input.coveragePercent,
        }),
        ...(input.isActive !== undefined && {
          isActive: input.isActive,
        }),
        updatedAt: new Date(),
      })
      .where(eq(patientMutuals.id, mutualLinkId))
      .returning();

    if (!updated) {
      throw new Error('Patient mutual update did not return a row');
    }

    // Fetch with mutual name/code via join
    const result = await db
      .select({
        id: patientMutuals.id,
        patientId: patientMutuals.patientId,
        mutualId: patientMutuals.mutualId,
        mutualName: mutuals.name,
        mutualCode: mutuals.code,
        planName: patientMutuals.planName,
        affiliateNumber: patientMutuals.affiliateNumber,
        coveragePercent: patientMutuals.coveragePercent,
        isActive: patientMutuals.isActive,
        createdAt: patientMutuals.createdAt,
        updatedAt: patientMutuals.updatedAt,
      })
      .from(patientMutuals)
      .innerJoin(mutuals, eq(patientMutuals.mutualId, mutuals.id))
      .where(eq(patientMutuals.id, mutualLinkId))
      .limit(1);

    return result[0]!;
  }
}
