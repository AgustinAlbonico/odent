import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, gte, lt, lte, sql } from 'drizzle-orm';
import { DatabaseService } from '../../../infra/database/database.service.js';
import { appointments, patients } from '../../../infra/database/schema.js';
import { RemindersService } from './reminders.service.js';
import { HolidaysService } from '../holidays.service.js';
import { WhatsAppService } from '../whatsapp/whatsapp.service.js';

// ─── Reminders Processor ──────────────────────────────────────────────────

@Processor('reminders')
export class RemindersProcessor extends WorkerHost {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(private readonly remindersService: RemindersService) {
    super();
  }

  async process(job: Job<{ appointmentId: string; tenantId: string }>) {
    this.logger.log(`Processing reminder job ${job.id} for appointment ${job.data.appointmentId}`);
    await this.remindersService.sendReminder(
      job.data.appointmentId,
      job.data.tenantId,
    );
  }
}

// ─── Confirmations Processor ──────────────────────────────────────────────

@Processor('confirmations')
export class ConfirmationsProcessor extends WorkerHost {
  private readonly logger = new Logger(ConfirmationsProcessor.name);

  constructor(
    private readonly dbService: DatabaseService,
    private readonly remindersService: RemindersService,
  ) {
    super();
  }

  async process(job: Job) {
    this.logger.log('Processing confirmations job');

    const db = this.dbService.db;
    const confirmationWindowHours = parseInt(
      process.env.CONFIRMATION_WINDOW_HOURS || '48',
      10,
    );

    const now = new Date();
    const windowStart = new Date(now.getTime() + confirmationWindowHours * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + (confirmationWindowHours + 2) * 60 * 60 * 1000);

    try {
      // Find pending appointments in the confirmation window
      const appts = await db
        .select({
          id: appointments.id,
          tenantId: appointments.tenantId,
          startAt: appointments.startAt,
          reminderSentAt: appointments.reminderSentAt,
        })
        .from(appointments)
        .where(
          and(
            eq(appointments.status, 'pending'),
            gte(appointments.startAt, now),
            lte(appointments.startAt, windowEnd),
          ),
        );

      this.logger.log(`Found ${appts.length} appointments needing confirmation`);

      for (const appt of appts) {
        // Skip if reminder already sent recently (within last 24h)
        if (
          appt.reminderSentAt &&
          now.getTime() - appt.reminderSentAt.getTime() < 24 * 60 * 60 * 1000
        ) {
          continue;
        }

        await this.remindersService.sendConfirmationRequest(
          appt.id,
          appt.tenantId,
        );
      }

      return { processed: appts.length };
    } catch (error) {
      this.logger.error(`Error in confirmations job: ${error}`);
      throw error;
    }
  }
}

// ─── WhatsApp Outbound Processor ──────────────────────────────────────────

@Processor('whatsapp-outbound')
export class WhatsAppOutboundProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsAppOutboundProcessor.name);

  constructor(private readonly whatsappService: WhatsAppService) {
    super();
  }

  async process(job: Job<{ phoneNumber: string; text: string; buttons?: Array<{ id: string; title: string }> }>) {
    const { phoneNumber, text, buttons } = job.data;

    try {
      if (buttons && buttons.length > 0) {
        await this.whatsappService.sendButtons(phoneNumber, text, buttons);
      } else {
        await this.whatsappService.sendText(phoneNumber, text);
      }
      this.logger.log(`WhatsApp message sent to ${phoneNumber}`);
    } catch (error) {
      this.logger.error(`Error sending WhatsApp to ${phoneNumber}: ${error}`);
      throw error;
    }
  }
}

// ─── Email Outbound Processor ─────────────────────────────────────────────

@Processor('email-outbound')
export class EmailOutboundProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailOutboundProcessor.name);

  constructor(private readonly remindersService: RemindersService) {
    super();
  }

  async process(job: Job<{ appointmentId: string; tenantId: string }>) {
    const { appointmentId, tenantId } = job.data;

    try {
      await this.remindersService.sendEmailBackup(appointmentId, tenantId);
      this.logger.log(`Email sent for appointment ${appointmentId}`);
    } catch (error) {
      this.logger.error(`Error sending email for appointment ${appointmentId}: ${error}`);
      throw error;
    }
  }
}

// ─── Holidays Sync Processor ──────────────────────────────────────────────

@Processor('holidays-sync')
export class HolidaysSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(HolidaysSyncProcessor.name);

  constructor(private readonly holidaysService: HolidaysService) {
    super();
  }

  async process(job: Job) {
    this.logger.log('Starting holidays sync job');

    try {
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;

      // For the worker, we need a default tenant. In multi-tenant setups,
      // this would iterate over all tenants. For now, sync with a default.
      // The tenantId should come from job data or environment.
      const tenantId = process.env.DEFAULT_TENANT_ID || '';

      if (!tenantId) {
        this.logger.warn('DEFAULT_TENANT_ID not set, skipping holidays sync');
        return { synced: 0, message: 'No tenant configured' };
      }

      const resultCurrent = await this.holidaysService.syncFromArgentinaDatos(
        currentYear,
        tenantId,
      );
      const resultNext = await this.holidaysService.syncFromArgentinaDatos(
        nextYear,
        tenantId,
      );

      const totalSynced = (resultCurrent.synced ?? 0) + (resultNext.synced ?? 0);
      this.logger.log(`Holidays sync complete: ${totalSynced} holidays synced`);

      return {
        synced: totalSynced,
        years: [currentYear, nextYear],
      };
    } catch (error) {
      this.logger.error(`Error in holidays sync job: ${error}`);
      throw error;
    }
  }
}
