import { Injectable } from '@nestjs/common';
import type { PlanRestrictionResult, TenantPlan, TenantContext } from '@sistema-odontologico/tenancy-core';
import { PLAN_LIMITS } from '@sistema-odontologico/tenancy-core';

/**
 * Plan restriction service — evaluates institutional plan capacity
 * SEPARATELY from RBAC permission, SEPARATELY from data scope,
 * and SEPARATELY from the professional's own status.
 */
@Injectable()
export class PlanGovernanceService {
  /**
   * Check if a professional growth action (create/activate/reactivate)
   * is allowed by the institutional plan.
   */
  checkProfessionalQuota(tenant: TenantContext): PlanRestrictionResult {
    const { activeProfessionalCount, maxActiveProfessionals, gracePeriodEnd } = tenant;

    // Under quota — allowed
    if (activeProfessionalCount < maxActiveProfessionals) {
      return {
        allowed: true,
        current: activeProfessionalCount,
        maximum: maxActiveProfessionals,
      };
    }

    // Over quota with grace period still active
    if (gracePeriodEnd && new Date() < gracePeriodEnd) {
      return {
        allowed: false,
        reason: 'grace_active',
        current: activeProfessionalCount,
        maximum: maxActiveProfessionals,
        gracePeriodEnd,
      };
    }

    // Over quota, grace expired (or never had one)
    if (gracePeriodEnd && new Date() >= gracePeriodEnd) {
      return {
        allowed: false,
        reason: 'grace_expired_over_quota',
        current: activeProfessionalCount,
        maximum: maxActiveProfessionals,
        gracePeriodEnd,
      };
    }

    // Over quota, no grace period
    return {
      allowed: false,
      reason: 'quota_exhausted',
      current: activeProfessionalCount,
      maximum: maxActiveProfessionals,
    };
  }

  /**
   * Get plan limits for a given plan.
   */
  getPlanLimits(plan: TenantPlan) {
    return PLAN_LIMITS[plan];
  }
}
