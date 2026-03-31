import { Module } from '@nestjs/common';
import { PlanGovernanceService } from './plan-governance.service.js';

@Module({
  providers: [PlanGovernanceService],
  exports: [PlanGovernanceService],
})
export class PlanGovernanceModule {}
