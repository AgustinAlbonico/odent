import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '../../../infra/database/database.module.js';
import { RemindersService } from './reminders.service.js';
import { RemindersProcessor } from './reminders.processor.js';
import { WhatsAppService } from '../whatsapp/whatsapp.service.js';

@Module({
  imports: [
    DatabaseModule,
    BullModule.registerQueue(
      { name: 'reminders' },
      { name: 'confirmations' },
      { name: 'whatsapp-outbound' },
      { name: 'email-outbound' },
      { name: 'holidays-sync' },
    ),
  ],
  providers: [RemindersService, RemindersProcessor, WhatsAppService],
  exports: [RemindersService],
})
export class RemindersModule {}
