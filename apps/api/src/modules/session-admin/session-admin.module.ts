import { Module } from '@nestjs/common';
import { SessionAdminController } from './session-admin.controller.js';
import { DatabaseModule } from '../../infra/database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [SessionAdminController],
})
export class SessionAdminModule {}
