import { describe, it, expect } from 'vitest';
import { TenantPlan, PLAN_LIMITS, tenantSchema, type TenantContext } from '../src/index.js';

// ─── PLAN_LIMITS coverage ─────────────────────────────────────────────────

describe('PLAN_LIMITS', () => {
  it('has entries for all TenantPlan values', () => {
    const planValues = Object.values(TenantPlan);
    for (const plan of planValues) {
      expect(PLAN_LIMITS[plan], `PLAN_LIMITS should have entry for ${plan}`).toBeDefined();
    }
  });

  it('has exactly 4 plan tiers', () => {
    expect(Object.keys(PLAN_LIMITS)).toHaveLength(4);
  });
});

// ─── Monotonically increasing limits ──────────────────────────────────────

describe('Plan limits increase monotonically', () => {
  it('free < basic < professional < enterprise for maxActiveProfessionals', () => {
    const free = PLAN_LIMITS[TenantPlan.FREE].maxActiveProfessionals;
    const basic = PLAN_LIMITS[TenantPlan.BASIC].maxActiveProfessionals;
    const professional = PLAN_LIMITS[TenantPlan.PROFESSIONAL].maxActiveProfessionals;
    const enterprise = PLAN_LIMITS[TenantPlan.ENTERPRISE].maxActiveProfessionals;

    expect(free).toBeLessThan(basic);
    expect(basic).toBeLessThan(professional);
    expect(professional).toBeLessThan(enterprise);
  });

  it('free plan allows at least 1 professional', () => {
    expect(PLAN_LIMITS[TenantPlan.FREE].maxActiveProfessionals).toBeGreaterThanOrEqual(1);
  });

  it('enterprise plan allows significantly more than free', () => {
    const free = PLAN_LIMITS[TenantPlan.FREE].maxActiveProfessionals;
    const enterprise = PLAN_LIMITS[TenantPlan.ENTERPRISE].maxActiveProfessionals;
    expect(enterprise).toBeGreaterThan(free * 2);
  });
});

// ─── tenantSchema resolver ────────────────────────────────────────────────

describe('tenantSchema', () => {
  it('produces valid schema name for a UUID', () => {
    const schema = tenantSchema('550e8400-e29b-41d4-a716-446655440000');
    expect(schema).toBe('tenant_550e8400_e29b_41d4_a716_446655440000');
  });

  it('replaces all hyphens with underscores', () => {
    const schema = tenantSchema('a-b-c-d');
    expect(schema).toBe('tenant_a_b_c_d');
    expect(schema).not.toContain('-');
  });

  it('prefixes with tenant_', () => {
    const schema = tenantSchema('abc123');
    expect(schema).toMatch(/^tenant_/);
  });

  it('handles empty string (edge case)', () => {
    const schema = tenantSchema('');
    expect(schema).toBe('tenant_');
  });

  it('produces a valid PostgreSQL identifier', () => {
    const schema = tenantSchema('550e8400-e29b-41d4-a716-446655440000');
    // PostgreSQL identifiers: start with letter or underscore, only alphanumeric + underscore
    expect(schema).toMatch(/^[a-z_][a-z0-9_]*$/);
  });
});

// ─── TenantContext interface compliance ────────────────────────────────────

describe('TenantContext', () => {
  it('can be constructed with all required fields', () => {
    const ctx: TenantContext = {
      tenantId: 'tenant-1',
      schema: 'tenant_tenant_1',
      name: 'Clínica Test',
      plan: TenantPlan.PROFESSIONAL,
      maxActiveProfessionals: 10,
      activeProfessionalCount: 5,
    };
    expect(ctx.tenantId).toBe('tenant-1');
    expect(ctx.plan).toBe(TenantPlan.PROFESSIONAL);
    expect(ctx.gracePeriodEnd).toBeUndefined();
  });

  it('supports optional gracePeriodEnd', () => {
    const graceEnd = new Date('2026-05-01');
    const ctx: TenantContext = {
      tenantId: 'tenant-2',
      schema: 'tenant_tenant_2',
      name: 'Clínica Gracia',
      plan: TenantPlan.BASIC,
      maxActiveProfessionals: 3,
      activeProfessionalCount: 4,
      gracePeriodEnd: graceEnd,
    };
    expect(ctx.gracePeriodEnd).toEqual(graceEnd);
  });
});
