import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AbilitiesController } from './abilities.controller.js';
import { PasswordModule } from './password/password.module.js';
import { DatabaseModule } from '../../infra/database/database.module.js';
import { SecurityModule } from '../security/security.module.js';
import { PermissionsModule } from '../permissions/permissions.module.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenancyModule } from '../tenancy/tenancy.module.js';
import { SessionPolicyModule } from '../session-policy/session-policy.module.js';

@Module({
  imports: [
    DatabaseModule,
    SecurityModule,
    PermissionsModule,
    TenancyModule,
    SessionPolicyModule,
    PasswordModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    }),
  ],
  controllers: [AuthController, AbilitiesController],
  providers: [
    AuthService,
    AuthGuard,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
