import { Module } from '@nestjs/common';
import { AccountAdminController } from './account-admin.controller.js';
import { PasswordController } from './password.controller.js';
import { PasswordService } from './password.service.js';
import { DatabaseModule } from '../../../infra/database/database.module.js';
import { SecurityModule } from '../../security/security.module.js';

@Module({
  imports: [DatabaseModule, SecurityModule],
  controllers: [PasswordController, AccountAdminController],
  providers: [PasswordService],
  exports: [PasswordService],
})
export class PasswordModule {}
