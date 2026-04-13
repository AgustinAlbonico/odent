import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '../infra/database/database.module.js';
import { AppointmentsModule } from '../modules/appointments/appointments.module.js';
import { RemindersModule } from '../modules/appointments/reminders/reminders.module.js';
import {
  ConfirmationsProcessor,
  EmailOutboundProcessor,
  HolidaysSyncProcessor,
  RemindersProcessor,
  WhatsAppOutboundProcessor,
} from '../modules/appointments/reminders/reminders.processor.js';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    }),
    DatabaseModule,
    AppointmentsModule,
    RemindersModule,
  ],
  providers: [
    RemindersProcessor,
    ConfirmationsProcessor,
    WhatsAppOutboundProcessor,
    EmailOutboundProcessor,
    HolidaysSyncProcessor,
  ],
})
export class WorkerModule {}
