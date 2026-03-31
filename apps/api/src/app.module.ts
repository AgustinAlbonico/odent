import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { DatabaseModule } from './infra/database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { TenancyModule } from './modules/tenancy/tenancy.module.js';
import { PermissionsModule } from './modules/permissions/permissions.module.js';
import { PlanGovernanceModule } from './modules/plan-governance/plan-governance.module.js';
import { SecurityModule } from './modules/security/security.module.js';
import { SessionAdminModule } from './modules/session-admin/session-admin.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { PermissionReviewModule } from './modules/permission-review/permission-review.module.js';
import { ProfessionalsModule } from './modules/professionals/professionals.module.js';
import { SessionPolicyModule } from './modules/session-policy/session-policy.module.js';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    TenancyModule,
    PermissionsModule,
    PlanGovernanceModule,
    SecurityModule,
    SessionAdminModule,
    AuditModule,
    PermissionReviewModule,
    ProfessionalsModule,
    SessionPolicyModule,
    HealthModule,
  ],
})
export class AppModule {}
