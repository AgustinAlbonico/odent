import { Module } from '@nestjs/common';
import { PermissionReviewController } from './permission-review.controller.js';
import { PermissionReviewService } from './permission-review.service.js';
import { DatabaseModule } from '../../infra/database/database.module.js';

@Module({
  imports: [DatabaseModule],
  controllers: [PermissionReviewController],
  providers: [PermissionReviewService],
  exports: [PermissionReviewService],
})
export class PermissionReviewModule {}
