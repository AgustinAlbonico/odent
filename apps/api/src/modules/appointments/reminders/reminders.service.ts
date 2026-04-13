import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { and, eq, sql } from 'drizzle-orm';
import { DatabaseService } from '../../../infra/database/database.service.js';
import { appointments, patients } from '../../../infra/database/schema.js';
import { WhatsAppService } from '../whatsapp/whatsapp.service.js';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly dbService: DatabaseService,
    private readonly whatsappService: WhatsAppService,
    @InjectQueue('reminders') private remindersQueue: Queue,
    @InjectQueue('whatsapp-outbound') private whatsappQueue: Queue,
    @InjectQueue('email-outbound') private emailQueue: Queue,
  ) {}

  /**
   * Schedule a reminder job for an appointment.
   * Adds a job to the 'reminders' queue with appropriate delay.
   */
  async scheduleReminder(appointmentId: string, tenantId: string): Promise<void> {
    try {
      await this.remindersQueue.add(
        'send-reminder',
        { appointmentId, tenantId },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
      this.logger.log(
        `Reminder scheduled for appointment ${appointmentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule reminder for appointment ${appointmentId}: ${error}`,
      );
    }
  }

  /**
   * Send reminder via WhatsApp (main channel).
   * - Fetches appointment with patient and professional data
   * - Gets patient phone number
   * - Sends WhatsApp message with reminder format
   * - Updates reminder_sent_at on the appointment
   * - Enqueues backup email with 1-hour delay
   */
  async sendReminder(appointmentId: string, tenantId: string): Promise<void> {
    const db = this.dbService.db;

    try {
      // Fetch appointment with patient and professional data
      const rows = await db
        .select({
          id: appointments.id,
          startAt: appointments.startAt,
          endAt: appointments.endAt,
          status: appointments.status,
          patientId: appointments.patientId,
          patientName: patients.firstName,
          patientLastName: patients.lastName,
          patientPhone: patients.phone,
          professionalName: sql<string>`u.first_name`,
          professionalLastName: sql<string>`u.last_name`,
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .innerJoin(sql`users u`, eq(appointments.professionalId, sql`u.id`))
        .where(
          and(
            eq(appointments.id, appointmentId),
            eq(appointments.tenantId, tenantId),
          ),
        )
        .limit(1);

      const row = rows[0];
      if (!row) {
        this.logger.warn(
          `Appointment ${appointmentId} not found for reminder`,
        );
        return;
      }

      // Skip if already sent or appointment is cancelled
      if (row.status === 'cancelled' || row.status === 'no_show') {
        this.logger.log(
          `Skipping reminder for appointment ${appointmentId}: status is ${row.status}`,
        );
        return;
      }

      if (!row.patientPhone) {
        this.logger.warn(
          `Patient ${row.patientId} has no phone number, skipping WhatsApp reminder`,
        );
        // Still try to send email backup
        await this.sendEmailBackup(appointmentId, tenantId);
        return;
      }

      // Format and send WhatsApp message
      const message = this.formatAppointmentMessage({
        patientName: row.patientName,
        patientLastName: row.patientLastName,
        professionalName: row.professionalName,
        professionalLastName: row.professionalLastName,
        startAt: row.startAt,
      });

      await this.whatsappService.sendText(row.patientPhone, message);

      // Update reminder_sent_at
      await db
        .update(appointments)
        .set({ reminderSentAt: new Date(), updatedAt: new Date() })
        .where(eq(appointments.id, appointmentId));

      this.logger.log(
        `WhatsApp reminder sent for appointment ${appointmentId}`,
      );

      // Enqueue backup email with 1-hour delay
      await this.emailQueue.add(
        'send-email-backup',
        { appointmentId, tenantId },
        {
          delay: 60 * 60 * 1000, // 1 hour
          attempts: 2,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: 50,
        },
      );
    } catch (error) {
      this.logger.error(
        `Error sending reminder for appointment ${appointmentId}: ${error}`,
      );
      throw error; // Re-throw so BullMQ can retry
    }
  }

  /**
   * Send email backup via Resend API.
   * Uses fetch to call Resend API with API key from environment.
   */
  async sendEmailBackup(appointmentId: string, tenantId: string): Promise<void> {
    const db = this.dbService.db;

    try {
      const rows = await db
        .select({
          id: appointments.id,
          startAt: appointments.startAt,
          endAt: appointments.endAt,
          patientEmail: patients.email,
          patientName: patients.firstName,
          patientLastName: patients.lastName,
          professionalName: sql<string>`u.first_name`,
          professionalLastName: sql<string>`u.last_name`,
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .innerJoin(sql`users u`, eq(appointments.professionalId, sql`u.id`))
        .where(
          and(
            eq(appointments.id, appointmentId),
            eq(appointments.tenantId, tenantId),
          ),
        )
        .limit(1);

      const row = rows[0];
      if (!row) {
        this.logger.warn(
          `Appointment ${appointmentId} not found for email backup`,
        );
        return;
      }

      if (!row.patientEmail) {
        this.logger.warn(
          `Patient has no email for appointment ${appointmentId}, skipping email backup`,
        );
        return;
      }

      const resendApiKey = process.env.RESEND_API_KEY;
      const resendFrom = process.env.RESEND_FROM || 'noreply@dentalsoft.com';

      if (!resendApiKey) {
        this.logger.warn('RESEND_API_KEY not configured, skipping email backup');
        return;
      }

      const subject = this.formatEmailSubject({
        patientName: row.patientName,
        professionalName: row.professionalName,
        professionalLastName: row.professionalLastName,
        startAt: row.startAt,
      });

      const html = this.formatEmailBody({
        patientName: row.patientName,
        patientLastName: row.patientLastName,
        professionalName: row.professionalName,
        professionalLastName: row.professionalLastName,
        startAt: row.startAt,
        endAt: row.endAt,
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [row.patientEmail],
          subject,
          html,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Resend API error for appointment ${appointmentId}: ${response.status} ${errorText}`,
        );
        throw new Error(`Resend API error: ${response.status}`);
      }

      this.logger.log(
        `Email backup sent for appointment ${appointmentId}`,
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error(`Timeout sending email backup for ${appointmentId}`);
      } else {
        this.logger.error(
          `Error sending email backup for appointment ${appointmentId}: ${error}`,
        );
      }
      throw error;
    }
  }

  /**
   * Send confirmation request via WhatsApp.
   * Similar to sendReminder but with confirmation buttons.
   */
  async sendConfirmationRequest(
    appointmentId: string,
    tenantId: string,
  ): Promise<void> {
    const db = this.dbService.db;

    try {
      const rows = await db
        .select({
          id: appointments.id,
          startAt: appointments.startAt,
          patientPhone: patients.phone,
          patientName: patients.firstName,
          patientLastName: patients.lastName,
          professionalName: sql<string>`u.first_name`,
          professionalLastName: sql<string>`u.last_name`,
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .innerJoin(sql`users u`, eq(appointments.professionalId, sql`u.id`))
        .where(
          and(
            eq(appointments.id, appointmentId),
            eq(appointments.tenantId, tenantId),
          ),
        )
        .limit(1);

      const row = rows[0];
      if (!row) {
        this.logger.warn(
          `Appointment ${appointmentId} not found for confirmation request`,
        );
        return;
      }

      if (!row.patientPhone) {
        this.logger.warn(
          `Patient has no phone for appointment ${appointmentId}`,
        );
        return;
      }

      const startAt = new Date(row.startAt);
      const fecha = startAt.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      const hora = startAt.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const professionalName = `${row.professionalName} ${row.professionalLastName ?? ''}`.trim();
      const patientName = `${row.patientName} ${row.patientLastName ?? ''}`.trim();

      const text = `🦷 ¡Hola ${patientName}! Tenés un turno el ${fecha} a las ${hora} con ${professionalName}. ¿Confirmás tu asistencia?\n\n1️⃣ Sí, confirmo\n2️⃣ No, necesito reprogramar\n3️⃣ No, cancelo`;

      const buttons = [
        { id: 'confirm_yes', title: '✅ Sí, confirmo' },
        { id: 'confirm_reschedule', title: '🔄 Reprogramar' },
        { id: 'confirm_cancel', title: '❌ Cancelo' },
      ];

      await this.whatsappService.sendButtons(row.patientPhone, text, buttons);

      this.logger.log(
        `Confirmation request sent for appointment ${appointmentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error sending confirmation request for appointment ${appointmentId}: ${error}`,
      );
      throw error;
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  /**
   * Format appointment data for WhatsApp reminder message.
   */
  private formatAppointmentMessage(appt: {
    patientName: string;
    patientLastName: string;
    professionalName: string;
    professionalLastName: string;
    startAt: Date;
  }): string {
    const startAt = new Date(appt.startAt);
    const fecha = startAt.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const hora = startAt.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const professionalName = `${appt.professionalName} ${appt.professionalLastName ?? ''}`.trim();
    const patientName = `${appt.patientName} ${appt.patientLastName ?? ''}`.trim();

    return `🦷 Recordatorio de turno\n\nHola ${patientName}, te recordamos que tenés un turno:\n\n📅 ${fecha}\n⏰ ${hora}\n👨‍⚕️ ${professionalName}\n\n¡Te esperamos! 😊`;
  }

  /**
   * Format email subject line.
   */
  private formatEmailSubject(appt: {
    patientName: string;
    professionalName: string;
    professionalLastName: string;
    startAt: Date;
  }): string {
    const startAt = new Date(appt.startAt);
    const fecha = startAt.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
    });
    return `Recordatorio de turno - ${fecha}`;
  }

  /**
   * Format email body HTML.
   */
  private formatEmailBody(appt: {
    patientName: string;
    patientLastName: string;
    professionalName: string;
    professionalLastName: string;
    startAt: Date;
    endAt: Date;
  }): string {
    const startAt = new Date(appt.startAt);
    const endAt = new Date(appt.endAt);

    const fecha = startAt.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const horaInicio = startAt.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const horaFin = endAt.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const professionalName = `${appt.professionalName} ${appt.professionalLastName ?? ''}`.trim();
    const patientName = `${appt.patientName} ${appt.patientLastName ?? ''}`.trim();

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🦷 Recordatorio de Turno</h2>
        <p>Hola <strong>${patientName}</strong>,</p>
        <p>Te recordamos que tenés un turno programado:</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">📅 Fecha</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${fecha}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">⏰ Horario</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${horaInicio} - ${horaFin}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">👨‍⚕️ Profesional</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${professionalName}</td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 14px;">
          Si necesitás reprogramar o cancelar tu turno, contactanos lo antes posible.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          Este es un mensaje automático, por favor no respondas a este email.
        </p>
      </div>
    `;
  }
}
