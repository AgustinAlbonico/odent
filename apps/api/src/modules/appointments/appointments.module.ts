import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infra/database/database.module.js';
import { AppointmentsController } from './appointments.controller.js';
import { AppointmentsRepository } from './appointments.repository.js';
import { AppointmentsService } from './appointments.service.js';
import { ConflictsService } from './conflicts.service.js';
import { StateTransitionsService } from './state-transitions.service.js';
import { SchedulesService } from './schedules.service.js';
import { ExceptionsService } from './exceptions.service.js';
import { HolidaysService } from './holidays.service.js';
import { WhatsAppWebhookController } from './whatsapp/whatsapp.controller.js';
import { WhatsAppService } from './whatsapp/whatsapp.service.js';
import { BotStateMachine } from './whatsapp/bot-statemachine.js';
import { RemindersModule } from './reminders/reminders.module.js';

@Module({
  imports: [DatabaseModule, RemindersModule],
  controllers: [AppointmentsController, WhatsAppWebhookController],
  providers: [
    AppointmentsRepository,
    AppointmentsService,
    ConflictsService,
    StateTransitionsService,
    SchedulesService,
    ExceptionsService,
    HolidaysService,
    WhatsAppService,
    BotStateMachine,
  ],
  exports: [
    AppointmentsRepository,
    AppointmentsService,
    ConflictsService,
    StateTransitionsService,
    SchedulesService,
    ExceptionsService,
    HolidaysService,
  ],
})
export class AppointmentsModule {}
