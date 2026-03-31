import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { tenants } from '../../infra/database/schema.js';
import { DatabaseService } from '../../infra/database/database.service.js';
import type { TenantContext, TenantPlan } from '@sistema-odontologico/tenancy-core';

@Injectable()
export class TenantService {
  constructor(private readonly dbService: DatabaseService) {}

  extractTenantId(headerValue: string | string[] | undefined): string | null {
    if (Array.isArray(headerValue)) {
      const firstTenantId = headerValue.find((value) => value.trim().length > 0);
      return firstTenantId?.trim() ?? null;
    }

    if (typeof headerValue !== 'string') {
      return null;
    }

    const tenantId = headerValue.trim();
    return tenantId.length > 0 ? tenantId : null;
  }

  /**
   * Resolve tenant by ID with plan info.
   * Returns the full tenant context needed for auth/session.
   */
  async resolveTenant(tenantId: string): Promise<TenantContext | null> {
    const result = await this.dbService.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const row = result[0];
    if (!row) return null;

    return {
      tenantId: row.id,
      schema: row.schema,
      name: row.name,
      plan: row.plan as TenantPlan,
      maxActiveProfessionals: row.maxActiveProfessionals,
      activeProfessionalCount: row.activeProfessionalCount,
      gracePeriodEnd: row.gracePeriodEnd ?? undefined,
    };
  }

  /**
   * Create a new tenant with its own schema.
   */
  async createTenant(data: {
    name: string;
    plan: TenantPlan;
  }): Promise<TenantContext> {
    const tenantId = crypto.randomUUID();
    const schema = `tenant_${tenantId.replace(/-/g, '_')}`;

    await this.dbService.db.insert(tenants).values({
      id: tenantId,
      name: data.name,
      schema,
      plan: data.plan,
    });

    // Create the tenant schema
    await this.dbService.db.execute(sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(schema)}`);

    const result = await this.resolveTenant(tenantId);
    if (!result) throw new Error('Failed to create tenant');
    return result;
  }
}
