import { Module } from '@nestjs/common';
import { PlanRestrictionGuard } from '../../common/guards/plan-restriction.guard.js';
import { ProfessionalsService } from './professionals.service.js';
import { ProfessionalsController } from './professionals.controller.js';
import { DatabaseModule } from '../../infra/database/database.module.js';
import { PlanGovernanceModule } from '../plan-governance/plan-governance.module.js';

@Module({
  imports: [DatabaseModule, PlanGovernanceModule],
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService, PlanRestrictionGuard],
  exports: [ProfessionalsService],
})
export class ProfessionalsModule {}
