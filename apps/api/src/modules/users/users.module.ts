import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { DatabaseModule } from '../../infra/database/database.module.js';
import { PermissionsModule } from '../permissions/permissions.module.js';
import { PlanGovernanceModule } from '../plan-governance/plan-governance.module.js';
import { ProfessionalsModule } from '../professionals/professionals.module.js';

@Module({
  imports: [DatabaseModule, PermissionsModule, PlanGovernanceModule, ProfessionalsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
