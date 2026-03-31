import { describe, it, expect, beforeEach } from 'vitest';
import { PlanGovernanceService } from '../../src/modules/plan-governance/plan-governance.service.js';
import type { TenantContext } from '@sistema-odontologico/tenancy-core';
import { TenantPlan, PLAN_LIMITS } from '@sistema-odontologico/tenancy-core';

describe('PlanGovernanceService', () => {
  let service: PlanGovernanceService;

  beforeEach(() => {
    service = new PlanGovernanceService();
  });

  // ─── Cupo disponible ──────────────────────────────────────────────────

  describe('checkProfessionalQuota — cupo disponible', () => {
    it('returns allowed: true when under quota', () => {
      const tenant: TenantContext = {
        tenantId: 't1',
        schema: 'tenant_t1',
        name: 'Clínica Test',
        plan: TenantPlan.BASIC,
        maxActiveProfessionals: 3,
        activeProfessionalCount: 2,
      };

      const result = service.checkProfessionalQuota(tenant);

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(2);
      expect(result.maximum).toBe(3);
      expect(result.reason).toBeUndefined();
    });

    it('returns allowed: true when exactly at limit minus one', () => {
      const tenant: TenantContext = {
        tenantId: 't1',
        schema: 'tenant_t1',
        name: 'Clínica Test',
        plan: TenantPlan.FREE,
        maxActiveProfessionals: 1,
        activeProfessionalCount: 0,
      };

      const result = service.checkProfessionalQuota(tenant);
      expect(result.allowed).toBe(true);
    });
  });

  // ─── Cupo agotado sin grace ───────────────────────────────────────────

  describe('checkProfessionalQuota — cupo agotado (sin grace)', () => {
    it('returns quota_exhausted when at limit with no grace', () => {
      const tenant: TenantContext = {
        tenantId: 't1',
        schema: 'tenant_t1',
        name: 'Clínica Test',
        plan: TenantPlan.BASIC,
        maxActiveProfessionals: 3,
        activeProfessionalCount: 3,
        // gracePeriodEnd is undefined
      };

      const result = service.checkProfessionalQuota(tenant);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('quota_exhausted');
      expect(result.current).toBe(3);
      expect(result.maximum).toBe(3);
    });

    it('returns quota_exhausted when over limit with no grace', () => {
      const tenant: TenantContext = {
        tenantId: 't1',
        schema: 'tenant_t1',
        name: 'Clínica Test',
        plan: TenantPlan.BASIC,
        maxActiveProfessionals: 3,
        activeProfessionalCount: 5,
      };

      const result = service.checkProfessionalQuota(tenant);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('quota_exhausted');
    });
  });

  // ─── Cupo agotado + gracia activa ────────────────────────────────────

  describe('checkProfessionalQuota — gracia activa', () => {
    it('returns grace_active when over quota but grace period is still active', () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const tenant: TenantContext = {
        tenantId: 't1',
        schema: 'tenant_t1',
        name: 'Clínica Test',
        plan: TenantPlan.BASIC,
        maxActiveProfessionals: 3,
        activeProfessionalCount: 4,
        gracePeriodEnd: futureDate,
      };

      const result = service.checkProfessionalQuota(tenant);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('grace_active');
      expect(result.gracePeriodEnd).toEqual(futureDate);
    });
  });

  // ─── Cupo agotado + gracia expirada ──────────────────────────────────

  describe('checkProfessionalQuota — gracia expirada', () => {
    it('returns grace_expired_over_quota when over quota and grace expired', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const tenant: TenantContext = {
        tenantId: 't1',
        schema: 'tenant_t1',
        name: 'Clínica Test',
        plan: TenantPlan.BASIC,
        maxActiveProfessionals: 3,
        activeProfessionalCount: 4,
        gracePeriodEnd: pastDate,
      };

      const result = service.checkProfessionalQuota(tenant);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('grace_expired_over_quota');
      expect(result.gracePeriodEnd).toEqual(pastDate);
    });
  });

  // ─── Restriction does NOT affect other user permissions ───────────────

  describe('Plan restriction is independent of RBAC', () => {
    it('returns quota info without touching role/permission data', () => {
      // The service only evaluates plan limits, not user permissions
      const tenant: TenantContext = {
        tenantId: 't1',
        schema: 'tenant_t1',
        name: 'Clínica Test',
        plan: TenantPlan.FREE,
        maxActiveProfessionals: 1,
        activeProfessionalCount: 2,
      };

      const result = service.checkProfessionalQuota(tenant);

      // The result contains only quota-related info
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('current');
      expect(result).toHaveProperty('maximum');
      // It does NOT contain role, permissions, or user identity info
      expect((result as any).role).toBeUndefined();
      expect((result as any).permissions).toBeUndefined();
      expect((result as any).userId).toBeUndefined();
    });
  });

  // ─── getPlanLimits helper ─────────────────────────────────────────────

  describe('getPlanLimits', () => {
    it('returns correct limits for each plan', () => {
      for (const plan of Object.values(TenantPlan)) {
        const limits = service.getPlanLimits(plan);
        expect(limits.maxActiveProfessionals).toBe(PLAN_LIMITS[plan].maxActiveProfessionals);
      }
    });
  });
});
