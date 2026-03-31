import { Module } from '@nestjs/common';
import { TenantService } from './tenancy.service.js';
import { DatabaseModule } from '../../infra/database/database.module.js';

@Module({
  imports: [DatabaseModule],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenancyModule {}
