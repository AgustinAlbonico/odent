import { Controller, Get, Module } from '@nestjs/common';
import type { HealthResponse } from '@sistema-odontologico/types';
import { Public } from '../common/decorators/index.js';

@Controller('health')
class HealthController {
  @Get()
  @Public()
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
