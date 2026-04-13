import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module.js';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);

  console.log('[Worker] Application context created');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[Worker] SIGTERM received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('[Worker] SIGINT received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  console.error('[Worker] Failed to start:', error);
  process.exit(1);
});
