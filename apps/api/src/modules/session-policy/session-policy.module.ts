import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infra/database/database.module.js';
import { SessionPolicyController } from './session-policy.controller.js';
import { SessionPolicyRuntimeService } from './session-policy-runtime.service.js';
import { SessionPolicyService } from './session-policy.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [SessionPolicyController],
  providers: [SessionPolicyService, SessionPolicyRuntimeService],
  exports: [SessionPolicyService, SessionPolicyRuntimeService],
})
export class SessionPolicyModule {}
