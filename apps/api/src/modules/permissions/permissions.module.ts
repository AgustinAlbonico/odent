import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service.js';
import { DatabaseModule } from '../../infra/database/database.module.js';

@Module({
  imports: [DatabaseModule],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
