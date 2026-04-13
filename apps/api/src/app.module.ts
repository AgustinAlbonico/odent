import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
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
import { UsersModule } from './modules/users/users.module.js';
import { PatientsModule } from './modules/patients/patients.module.js';
import { MutualsModule } from './modules/mutuals/mutuals.module.js';
import { AppointmentsModule } from './modules/appointments/appointments.module.js';
import { StorageModule } from './modules/storage/index.js';
import { AuditInterceptor } from './common/interceptors/audit.interceptor.js';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    }),
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
    UsersModule,
    PatientsModule,
    MutualsModule,
    AppointmentsModule,
    HealthModule,
    StorageModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
