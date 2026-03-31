/**
 * Institutional plan tiers.
 * Each tier defines different capacity limits.
 */
export var TenantPlan;
(function (TenantPlan) {
    TenantPlan["FREE"] = "free";
    TenantPlan["BASIC"] = "basic";
    TenantPlan["PROFESSIONAL"] = "professional";
    TenantPlan["ENTERPRISE"] = "enterprise";
})(TenantPlan || (TenantPlan = {}));
/**
 * Plan capacity limits.
 * These are product-defined safe bounds — admins cannot override.
 */
export const PLAN_LIMITS = {
    [TenantPlan.FREE]: { maxActiveProfessionals: 1 },
    [TenantPlan.BASIC]: { maxActiveProfessionals: 3 },
    [TenantPlan.PROFESSIONAL]: { maxActiveProfessionals: 10 },
    [TenantPlan.ENTERPRISE]: { maxActiveProfessionals: 50 },
};
/**
 * Schema name resolver.
 * Maps tenant ID → DB schema name.
 */
export function tenantSchema(tenantId) {
    return `tenant_${tenantId.replace(/-/g, '_')}`;
}
//# sourceMappingURL=tenant.js.map