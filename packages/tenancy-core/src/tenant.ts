/**
 * Tenant (institution) data resolved from request.
 */
export interface TenantContext {
  /** Institution ID */
  tenantId: string;
  /** DB schema name for this tenant */
  schema: string;
  /** Institution name (for display) */
  name: string;
  /** Active plan slug */
  plan: TenantPlan;
  /** Max active professionals allowed by plan */
  maxActiveProfessionals: number;
  /** Current active professional count */
  activeProfessionalCount: number;
  /** Grace period for over-quota (null if not in grace) */
  gracePeriodEnd?: Date;
}

/**
 * Institutional plan tiers.
 * Each tier defines different capacity limits.
 */
export enum TenantPlan {
  FREE = 'free',
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

/**
 * Plan capacity limits.
 * These are product-defined safe bounds — admins cannot override.
 */
export const PLAN_LIMITS: Record<TenantPlan, { maxActiveProfessionals: number }> = {
  [TenantPlan.FREE]: { maxActiveProfessionals: 1 },
  [TenantPlan.BASIC]: { maxActiveProfessionals: 3 },
  [TenantPlan.PROFESSIONAL]: { maxActiveProfessionals: 10 },
  [TenantPlan.ENTERPRISE]: { maxActiveProfessionals: 50 },
};

/**
 * Result of plan restriction check for professional growth.
 * This is SEPARATE from RBAC permission check and SEPARATE from professional state.
 */
export interface PlanRestrictionResult {
  /** Whether the action is allowed by plan */
  allowed: boolean;
  /** If blocked, why */
  reason?: 'quota_exhausted' | 'grace_active' | 'grace_expired_over_quota';
  /** Current quota status */
  current: number;
  /** Maximum allowed */
  maximum: number;
  /** Grace period end date if applicable */
  gracePeriodEnd?: Date;
}

/**
 * Schema name resolver.
 * Maps tenant ID → DB schema name.
 */
export function tenantSchema(tenantId: string): string {
  return `tenant_${tenantId.replace(/-/g, '_')}`;
}
