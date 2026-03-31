import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../infra/database/database.service.js';
import { PlanGovernanceService } from '../plan-governance/plan-governance.service.js';
import type { PlanRestrictionResult, TenantContext } from '@sistema-odontologico/tenancy-core';
import { tenants, users } from '../../infra/database/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Quota check result — returned by canCreate/Activate/Reactivate.
 *
 * The reason field identifies the QUOTA/GRACE as the blocking factor,
 * NOT the role or account-state. This is critical:
 * plan capacity ≠ RBAC permission ≠ data scope ≠ professional status.
 */
export interface QuotaCheckResult {
  allowed: boolean;
  reason?: 'quota_exhausted' | 'grace_active' | 'grace_expired_over_quota' | 'under_quota';
  quotaInfo: {
    current: number;
    maximum: number;
    remaining: number;
    gracePeriodEnd?: Date;
  };
}

export interface CreateProfessionalInput {
  firstName: string;
  lastName: string;
  email: string;
}

export interface ProfessionalMutationResult {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'profesional';
  state: 'active' | 'inactive' | 'locked' | 'pending_password_change';
}

type ProfessionalUser = typeof users.$inferSelect & {
  role: 'profesional';
};

/**
 * Professionals Service — plan-based blocking for professional growth actions.
 *
 * Evaluates institutional plan capacity SEPARATELY from:
 * - RBAC permission (handled by AuthGuard)
 * - Data scope (handled by scope dimension)
 * - Professional's own status (active/inactive/locked)
 *
 * If active professional quota is exhausted or tenant remains over quota
 * after grace, the growth action SHALL be blocked.
 *
 * Does NOT disable modules, unrelated permissions, or access of already
 * active professionals.
 *
 * Covers RF-AA-009A.
 */
@Injectable()
export class ProfessionalsService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly planGovernanceService: PlanGovernanceService,
  ) {}

  /**
   * Resolve TenantContext from the database for a given tenant ID.
   * Needed because PlanGovernanceService expects a full TenantContext.
   */
  private async resolveTenantContext(tenantId: string): Promise<TenantContext> {
    const [tenant] = await this.dbService.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    return {
      tenantId: tenant.id,
      schema: tenant.schema,
      name: tenant.name,
      plan: tenant.plan as TenantContext['plan'],
      maxActiveProfessionals: tenant.maxActiveProfessionals,
      activeProfessionalCount: tenant.activeProfessionalCount,
      gracePeriodEnd: tenant.gracePeriodEnd ?? undefined,
    };
  }

  /**
   * Check professional quota for a tenant.
   * Returns the raw PlanRestrictionResult from PlanGovernanceService.
   */
  async checkProfessionalQuota(tenantId: string): Promise<PlanRestrictionResult> {
    const tenantCtx = await this.resolveTenantContext(tenantId);
    return this.planGovernanceService.checkProfessionalQuota(tenantCtx);
  }

  /**
   * Build a QuotaCheckResult from a PlanRestrictionResult.
   * Used by canCreate/Activate/Reactivate.
   */
  private buildQuotaResult(result: PlanRestrictionResult): QuotaCheckResult {
    if (result.allowed) {
      return {
        allowed: true,
        reason: 'under_quota',
        quotaInfo: {
          current: result.current,
          maximum: result.maximum,
          remaining: result.maximum - result.current,
        },
      };
    }

    return {
      allowed: false,
      reason: result.reason,
      quotaInfo: {
        current: result.current,
        maximum: result.maximum,
        remaining: 0,
        gracePeriodEnd: result.gracePeriodEnd,
      },
    };
  }

  /**
   * Can the tenant create a new professional?
   * Checks quota only — RBAC and professional status are separate concerns.
   */
  async canCreateProfessional(tenantId: string): Promise<QuotaCheckResult> {
    const quota = await this.checkProfessionalQuota(tenantId);
    return this.buildQuotaResult(quota);
  }

  /**
   * Can the tenant activate an existing inactive professional?
   * Same quota check — activating a professional increases the active count.
   */
  async canActivateProfessional(tenantId: string): Promise<QuotaCheckResult> {
    const quota = await this.checkProfessionalQuota(tenantId);
    return this.buildQuotaResult(quota);
  }

  /**
   * Can the tenant reactivate a previously deactivated professional?
   * Same quota check — reactivating increases the active count.
   */
  async canReactivateProfessional(tenantId: string): Promise<QuotaCheckResult> {
    const quota = await this.checkProfessionalQuota(tenantId);
    return this.buildQuotaResult(quota);
  }

  async createProfessional(
    tenantId: string,
    input: CreateProfessionalInput,
  ): Promise<ProfessionalMutationResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existingUsers = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUsers[0]) {
      throw new ConflictException({
        code: 'professional_email_conflict',
        message: 'Ya existe un usuario con ese email.',
      });
    }

    const now = new Date();
    const passwordHash = await bcrypt.hash(uuidv4(), 10);

    const [createdProfessional] = await this.dbService.db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        role: 'profesional',
        state: 'active',
        mustChangePassword: true,
        updatedAt: now,
      })
      .returning();

    if (!createdProfessional) {
      throw new Error('Professional persistence did not return a row');
    }

    await this.incrementActiveProfessionalCount(tenantId);

    return this.toProfessionalMutationResult(createdProfessional as ProfessionalUser);
  }

  async activateProfessional(
    tenantId: string,
    professionalId: string,
  ): Promise<ProfessionalMutationResult> {
    return this.enableProfessional(tenantId, professionalId);
  }

  async reactivateProfessional(
    tenantId: string,
    professionalId: string,
  ): Promise<ProfessionalMutationResult> {
    return this.enableProfessional(tenantId, professionalId);
  }

  private async enableProfessional(
    tenantId: string,
    professionalId: string,
  ): Promise<ProfessionalMutationResult> {
    const professional = await this.findProfessionalById(professionalId);

    if (professional.state === 'active') {
      throw new ConflictException({
        code: 'professional_already_active',
        message: 'El profesional ya se encuentra activo.',
      });
    }

    const [updatedProfessional] = await this.dbService.db
      .update(users)
      .set({
        state: 'active',
        updatedAt: new Date(),
      })
      .where(eq(users.id, professionalId))
      .returning();

    if (!updatedProfessional) {
      throw new Error('Professional activation did not return a row');
    }

    await this.incrementActiveProfessionalCount(tenantId);

    return this.toProfessionalMutationResult(updatedProfessional as ProfessionalUser);
  }

  private async findProfessionalById(professionalId: string): Promise<ProfessionalUser> {
    const [professional] = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.id, professionalId))
      .limit(1);

    if (!professional || professional.role !== 'profesional') {
      throw new NotFoundException({
        code: 'professional_not_found',
        message: 'Profesional no encontrado.',
      });
    }

    return professional as ProfessionalUser;
  }

  private async incrementActiveProfessionalCount(tenantId: string) {
    const tenantContext = await this.resolveTenantContext(tenantId);

    await this.dbService.db
      .update(tenants)
      .set({
        activeProfessionalCount: tenantContext.activeProfessionalCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId));
  }

  private toProfessionalMutationResult(
    professional: ProfessionalUser,
  ): ProfessionalMutationResult {
    return {
      id: professional.id,
      email: professional.email,
      firstName: professional.firstName,
      lastName: professional.lastName,
      role: 'profesional',
      state: professional.state,
    };
  }
}
