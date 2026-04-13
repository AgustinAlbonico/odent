import { Module } from '@nestjs/common';
import { MutualsService } from './mutuals.service.js';
import { MutualsController } from './mutuals.controller.js';
import { ProfessionalMutualsController } from './professional-mutuals.controller.js';
import { DatabaseModule } from '../../infra/database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [MutualsController, ProfessionalMutualsController],
  providers: [MutualsService],
  exports: [MutualsService],
})
export class MutualsModule {}
