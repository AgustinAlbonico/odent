import { Module } from '@nestjs/common';
import { SecurityService } from './security.service.js';
import { DatabaseModule } from '../../infra/database/database.module.js';

@Module({
  imports: [DatabaseModule],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}
