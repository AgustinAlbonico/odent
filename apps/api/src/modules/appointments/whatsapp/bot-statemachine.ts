import { Injectable } from '@nestjs/common';
import { eq, gt, and, gte, lt } from 'drizzle-orm';
import { DatabaseService } from '../../../infra/database/database.service.js';
import {
  patients,
  appointments,
  users,
  whatsappBotSessions,
  appointmentSchedules,
  holidays,
  appointmentExceptions,
} from '../../../infra/database/schema.js';
import { AppointmentsService } from '../appointments.service.js';
import { StateTransitionsService } from '../state-transitions.service.js';
import { WhatsAppService } from './whatsapp.service.js';
import { BotState } from './whatsapp.types.js';
import type { BotContext, PatientInfo, WhatsAppButton } from './whatsapp.types.js';

const SESSION_EXPIRY_MINUTES = 30;

interface SessionRow {
  id: string;
  tenantId: string;
  phoneNumber: string;
  patientId: string | null;
  currentState: BotState;
  contextData: unknown;
  lastInteractionAt: Date;
  expiresAt: Date;
}

function toSessionRow(row: {
  id: string;
  tenantId: string;
  phoneNumber: string;
  patientId: string | null;
  currentState: string;
  contextData: unknown;
  lastInteractionAt: Date;
  expiresAt: Date;
}): SessionRow {
  return {
    ...row,
    currentState: row.currentState as BotState,
  };
}

@Injectable()
export class BotStateMachine {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly whatsappService: WhatsAppService,
    private readonly appointmentsService: AppointmentsService,
    private readonly stateTransitions: StateTransitionsService,
  ) {}

  async handleMessage(phoneNumber: string, message: string, tenantId: string): Promise<void> {
    const patient = await this.findPatientByPhone(phoneNumber, tenantId);
    if (!patient) {
      await this.whatsappService.sendText(
        phoneNumber,
        'No encontramos tu número registrado. Comunicate con la clínica para darte de alta.',
      );
      return;
    }

    const session = await this.getOrCreateSession(phoneNumber, tenantId, patient.id);
    if (!session) return;

    const context: BotContext = (session.contextData as BotContext) ?? {};

    if (this.isSessionExpired(session)) {
      await this.resetSession(session.id);
      await this.showMainMenu(phoneNumber, patient);
      return;
    }

    const trimmed = message.trim();

    switch (session.currentState) {
      case BotState.IDLE:
        await this.handleIdle(phoneNumber, trimmed, patient, context);
        break;
      case BotState.CONFIRMING:
        await this.handleConfirming(phoneNumber, trimmed, patient, context);
        break;
      case BotState.RESCHEDULING:
        await this.handleRescheduling(phoneNumber, trimmed, patient, context);
        break;
      case BotState.RESCHEDULING_SELECT_DATE:
        await this.handleReschedulingSelectDate(phoneNumber, trimmed, patient, context);
        break;
      case BotState.RESCHEDULING_SELECT_TIME:
        await this.handleReschedulingSelectTime(phoneNumber, trimmed, patient, context);
        break;
      case BotState.CANCELLING:
        await this.handleCancelling(phoneNumber, trimmed, patient, context);
        break;
      default:
        await this.resetSession(session.id);
        await this.showMainMenu(phoneNumber, patient);
        break;
    }

    await this.updateSessionLastInteraction(session.id);
  }

  // ─── IDLE ──────────────────────────────────────────────────────────────

  private async handleIdle(
    phoneNumber: string,
    message: string,
    patient: PatientInfo,
    _context: BotContext,
  ): Promise<void> {
    switch (message) {
      case '1':
        await this.startConfirming(phoneNumber, patient);
        break;
      case '2':
        await this.startRescheduling(phoneNumber, patient);
        break;
      case '3':
        await this.startCancelling(phoneNumber, patient);
        break;
      default:
        await this.showMainMenu(phoneNumber, patient);
        break;
    }
  }

  private async showMainMenu(phoneNumber: string, patient: PatientInfo): Promise<void> {
    const text = `🦷 ¡Hola ${patient.firstName}! ¿Qué querés hacer?\n\n1️⃣ Confirmar turno\n2️⃣ Reprogramar turno\n3️⃣ Cancelar turno\n\nRespondé con el número de la opción.`;
    await this.whatsappService.sendText(phoneNumber, text);
  }

  // ─── CONFIRMING ────────────────────────────────────────────────────────

  private async startConfirming(phoneNumber: string, patient: PatientInfo): Promise<void> {
    const db = this.dbService.db;
    const sessionRow = await this.findSessionByPhoneAndTenant(phoneNumber, patient.tenantId);
    if (sessionRow) {
      await db
        .update(whatsappBotSessions)
        .set({
          currentState: BotState.CONFIRMING,
          contextData: {},
          lastInteractionAt: new Date(),
          expiresAt: new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000),
        })
        .where(eq(whatsappBotSessions.id, sessionRow.id));
    }

    const appointment = await this.appointmentsService.findNextForPatient(
      patient.phone!,
      patient.tenantId,
    );

    if (!appointment) {
      await this.whatsappService.sendText(phoneNumber, 'No tenés turnos próximos.');
      if (sessionRow) {
        await this.resetToIdle(sessionRow.id);
      }
      return;
    }

    const dateStr = appointment.startAt.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const timeStr = appointment.startAt.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const text = `📋 Tenés un turno pendiente:\n\n👨‍⚕️ Profesional: ${appointment.professionalName}\n📅 Fecha: ${dateStr}\n⏰ Hora: ${timeStr}\n\n¿Podés asistir?`;

    const buttons: WhatsAppButton[] = [
      { id: 'confirm_yes', title: '✅ Confirmo' },
      { id: 'confirm_no', title: '❌ No puedo' },
    ];

    await this.whatsappService.sendButtons(phoneNumber, text, buttons);
  }

  private async handleConfirming(
    phoneNumber: string,
    message: string,
    patient: PatientInfo,
    context: BotContext,
  ): Promise<void> {
    const sessionId =
      (await this.findSessionByPhoneAndTenant(phoneNumber, patient.tenantId))?.id ?? '';

    if (message === 'confirm_yes' || message === '1') {
      const appointment = await this.appointmentsService.findNextForPatient(
        patient.phone!,
        patient.tenantId,
      );
      if (appointment) {
        await this.confirmAppointment(phoneNumber, appointment, patient);
      }
    } else {
      await this.whatsappService.sendText(
        phoneNumber,
        'Entendido. Si necesitás reprogramar, escribinos de nuevo.',
      );
      if (sessionId) {
        await this.resetToIdle(sessionId);
      }
    }
  }

  private async confirmAppointment(
    phoneNumber: string,
    appointment: {
      id: string;
      startAt: Date;
      professionalName: string;
    },
    patient: PatientInfo,
  ): Promise<void> {
    try {
      await this.appointmentsService.changeStatus(
        appointment.id,
        'confirmed',
        patient.tenantId,
        null,
      );
    } catch {
      // Already confirmed or invalid transition — still respond positively
    }

    const dateStr = appointment.startAt.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const timeStr = appointment.startAt.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    await this.whatsappService.sendText(
      phoneNumber,
      `¡Listo! Te esperamos el ${dateStr} a las ${timeStr}.`,
    );

    const session = await this.findSessionByPhoneAndTenant(phoneNumber, patient.tenantId);
    if (session) {
      await this.resetToIdle(session.id);
    }
  }

  // ─── RESCHEDULING ─────────────────────────────────────────────────────

  private async startRescheduling(phoneNumber: string, patient: PatientInfo): Promise<void> {
    const db = this.dbService.db;

    const appointment = await this.appointmentsService.findNextForPatient(
      patient.phone!,
      patient.tenantId,
    );

    if (!appointment) {
      await this.whatsappService.sendText(
        phoneNumber,
        'No tenés turnos próximos para reprogramar.',
      );
      return;
    }

    const context: BotContext = {
      appointmentId: appointment.id,
      professionalId: appointment.professionalId,
      tenantId: patient.tenantId,
    };

    const sessionRow = await this.findSessionByPhoneAndTenant(phoneNumber, patient.tenantId);
    if (sessionRow) {
      await db
        .update(whatsappBotSessions)
        .set({
          currentState: BotState.RESCHEDULING_SELECT_DATE,
          contextData: context,
          lastInteractionAt: new Date(),
          expiresAt: new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000),
        })
        .where(eq(whatsappBotSessions.id, sessionRow.id));
    }

    await this.showAvailableDates(phoneNumber, appointment.professionalId, patient.tenantId);
  }

  private async handleRescheduling(
    phoneNumber: string,
    _message: string,
    patient: PatientInfo,
    context: BotContext,
  ): Promise<void> {
    if (context.professionalId && context.tenantId) {
      await this.showAvailableDates(phoneNumber, context.professionalId, context.tenantId);
    }
  }

  private async handleReschedulingSelectDate(
    phoneNumber: string,
    message: string,
    patient: PatientInfo,
    context: BotContext,
  ): Promise<void> {
    const db = this.dbService.db;

    const selectedIndex = parseInt(message.replace('date_', ''), 10);
    if (isNaN(selectedIndex) || selectedIndex < 1 || selectedIndex > 7) {
      await this.whatsappService.sendText(
        phoneNumber,
        'Por favor, respondé con un número del 1 al 7.',
      );
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(today);
    selectedDate.setDate(today.getDate() + selectedIndex - 1);
    const dateStr = selectedDate.toISOString().split('T')[0]!;

    const updatedContext: BotContext = {
      ...context,
      selectedDate: dateStr,
    };

    const sessionRow = await this.findSessionByPhoneAndTenant(phoneNumber, patient.tenantId);
    if (sessionRow) {
      await db
        .update(whatsappBotSessions)
        .set({
          currentState: BotState.RESCHEDULING_SELECT_TIME,
          contextData: updatedContext,
          lastInteractionAt: new Date(),
          expiresAt: new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000),
        })
        .where(eq(whatsappBotSessions.id, sessionRow.id));
    }

    const professionalId = context.professionalId;
    const tenantId = patient.tenantId;
    if (professionalId) {
      await this.showAvailableTimes(phoneNumber, professionalId, dateStr, tenantId);
    }
  }

  private async handleReschedulingSelectTime(
    phoneNumber: string,
    message: string,
    patient: PatientInfo,
    context: BotContext,
  ): Promise<void> {
    const db = this.dbService.db;
    const sessionRow = await this.findSessionByPhoneAndTenant(phoneNumber, patient.tenantId);
    const sessionId = sessionRow?.id ?? '';

    if (!context.selectedDate || !context.appointmentId) {
      await this.whatsappService.sendText(
        phoneNumber,
        'Error: no se encontró la información del turno. Empezá de nuevo.',
      );
      if (sessionId) {
        await this.resetToIdle(sessionId);
      }
      return;
    }

    const timeParts = message.split(':');
    const hours = parseInt(timeParts[0] ?? '0', 10);
    const minutes = parseInt(timeParts[1] ?? '0', 10);

    if (isNaN(hours) || isNaN(minutes)) {
      await this.whatsappService.sendText(
        phoneNumber,
        'Por favor, respondé con un horario válido (ej: 09:00).',
      );
      return;
    }

    const selectedDateTime = new Date(
      `${context.selectedDate}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`,
    );

    const dateStr = selectedDateTime.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const timeStr = selectedDateTime.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const text = `📋 ¿Confirmás el nuevo turno?\n\n📅 ${dateStr}\n⏰ ${timeStr}\n\nRespondé "sí" para confirmar o "no" para volver al menú.`;
    const buttons: WhatsAppButton[] = [
      { id: 'reschedule_confirm', title: '✅ Confirmar' },
      { id: 'reschedule_cancel', title: '❌ Cancelar' },
    ];

    const updatedContext: BotContext = {
      ...context,
      selectedTime: message,
    };

    if (sessionRow) {
      await db
        .update(whatsappBotSessions)
        .set({
          contextData: updatedContext,
          lastInteractionAt: new Date(),
          expiresAt: new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000),
        })
        .where(eq(whatsappBotSessions.id, sessionRow.id));
    }

    await this.whatsappService.sendButtons(phoneNumber, text, buttons);
  }

  private async showAvailableDates(
    phoneNumber: string,
    professionalId: string,
    tenantId: string,
  ): Promise<void> {
    const db = this.dbService.db;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7);

    const schedules = await db
      .select()
      .from(appointmentSchedules)
      .where(
        and(
          eq(appointmentSchedules.tenantId, tenantId),
          eq(appointmentSchedules.professionalId, professionalId),
          eq(appointmentSchedules.isActive, true),
        ),
      );

    const holidayRows = await db
      .select()
      .from(holidays)
      .where(
        and(
          eq(holidays.tenantId, tenantId),
          eq(holidays.isActive, true),
          gte(holidays.date, today),
          lt(holidays.date, endDate),
        ),
      );
    const holidayDates = new Set(holidayRows.map((h) => h.date.toISOString().split('T')[0]));

    const exceptions = await db
      .select()
      .from(appointmentExceptions)
      .where(
        and(
          eq(appointmentExceptions.tenantId, tenantId),
          eq(appointmentExceptions.professionalId, professionalId),
          gte(appointmentExceptions.endDate, today),
          lt(appointmentExceptions.startDate, endDate),
        ),
      );

    const availableDates: { label: string; index: number }[] = [];
    let dayIndex = 0;
    const current = new Date(today);

    while (current < endDate && availableDates.length < 7) {
      dayIndex++;
      const dateStr = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay();

      if (!holidayDates.has(dateStr)) {
        const daySchedules = schedules.filter((s) => s.dayOfWeek === dayOfWeek);
        const hasSchedule = daySchedules.length > 0;

        const isException = exceptions.some((exc) => {
          if (exc.type === 'full_day') return true;
          return false;
        });

        if (hasSchedule && !isException) {
          const label = current.toLocaleDateString('es-AR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          });
          availableDates.push({ label, index: dayIndex });
        }
      }

      current.setDate(current.getDate() + 1);
    }

    if (availableDates.length === 0) {
      await this.whatsappService.sendText(
        phoneNumber,
        'No hay días disponibles en la próxima semana. Comunicate con la clínica.',
      );
      return;
    }

    const buttons: WhatsAppButton[] = availableDates.map((d) => ({
      id: `date_${d.index}`,
      title: d.label,
    }));

    await this.whatsappService.sendButtons(phoneNumber, '📅 Elegí un día para tu turno:', buttons);
  }

  private async showAvailableTimes(
    phoneNumber: string,
    professionalId: string,
    dateStr: string,
    tenantId: string,
  ): Promise<void> {
    const db = this.dbService.db;

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    const schedules = await db
      .select()
      .from(appointmentSchedules)
      .where(
        and(
          eq(appointmentSchedules.tenantId, tenantId),
          eq(appointmentSchedules.professionalId, professionalId),
          eq(appointmentSchedules.dayOfWeek, dayOfWeek),
          eq(appointmentSchedules.isActive, true),
        ),
      );

    const dayStart = new Date(dateStr);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dateStr);
    dayEnd.setHours(23, 59, 59, 999);

    const existingAppointments = await db
      .select({
        startAt: appointments.startAt,
        endAt: appointments.endAt,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          eq(appointments.professionalId, professionalId),
          gte(appointments.startAt, dayStart),
          lt(appointments.startAt, dayEnd),
        ),
      );

    const exceptions = await db
      .select()
      .from(appointmentExceptions)
      .where(
        and(
          eq(appointmentExceptions.tenantId, tenantId),
          eq(appointmentExceptions.professionalId, professionalId),
          gte(appointmentExceptions.endDate, date),
          lt(appointmentExceptions.startDate, date),
        ),
      );

    const availableTimes: string[] = [];

    for (const schedule of schedules) {
      const slotDuration = schedule.slotDurationMinutes ?? 30;
      const [startHour, startMin] = schedule.startTime.split(':').map(Number);
      const [endHour, endMin] = schedule.endTime.split(':').map(Number);

      let slotTime = new Date(date);
      slotTime.setHours(startHour ?? 0, startMin ?? 0, 0, 0);

      const slotEnd = new Date(date);
      slotEnd.setHours(endHour ?? 0, endMin ?? 0, 0, 0);

      while (slotTime < slotEnd) {
        const slotTimeStr = `${slotTime.getHours().toString().padStart(2, '0')}:${slotTime.getMinutes().toString().padStart(2, '0')}`;
        const slotEndAt = new Date(slotTime.getTime() + slotDuration * 60000);

        const isOccupied = existingAppointments.some((apt) => {
          const aptStart = apt.startAt.getTime();
          const aptEnd = apt.endAt.getTime();
          const slotStart = slotTime.getTime();
          const slotEndMs = slotEndAt.getTime();
          return slotStart < aptEnd && slotEndMs > aptStart;
        });

        const isException = exceptions.some((exc) => {
          if (exc.type === 'full_day') return true;
          if (exc.type === 'time_range' && exc.startTime && exc.endTime) {
            return slotTimeStr >= exc.startTime && slotTimeStr < exc.endTime;
          }
          return false;
        });

        if (!isOccupied && !isException) {
          availableTimes.push(slotTimeStr);
        }

        slotTime = new Date(slotTime.getTime() + slotDuration * 60000);
      }
    }

    if (availableTimes.length === 0) {
      await this.whatsappService.sendText(
        phoneNumber,
        'No hay horarios disponibles para ese día. Elegí otro día.',
      );
      return;
    }

    const displayTimes = availableTimes.slice(0, 10);
    const buttons: WhatsAppButton[] = displayTimes.map((t) => ({
      id: t,
      title: t,
    }));

    await this.whatsappService.sendButtons(phoneNumber, '⏰ Elegí un horario:', buttons);
  }

  // ─── CANCELLING ────────────────────────────────────────────────────────

  private async startCancelling(phoneNumber: string, patient: PatientInfo): Promise<void> {
    const db = this.dbService.db;

    const appointment = await this.appointmentsService.findNextForPatient(
      patient.phone!,
      patient.tenantId,
    );

    if (!appointment) {
      await this.whatsappService.sendText(phoneNumber, 'No tenés turnos próximos para cancelar.');
      return;
    }

    const sessionRow = await this.findSessionByPhoneAndTenant(phoneNumber, patient.tenantId);
    if (sessionRow) {
      await db
        .update(whatsappBotSessions)
        .set({
          currentState: BotState.CANCELLING,
          contextData: { appointmentId: appointment.id },
          lastInteractionAt: new Date(),
          expiresAt: new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000),
        })
        .where(eq(whatsappBotSessions.id, sessionRow.id));
    }

    const dateStr = appointment.startAt.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const timeStr = appointment.startAt.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const text = `⚠️ ¿Querés cancelar este turno?\n\n📅 ${dateStr} a las ${timeStr}\n👨‍⚕️ ${appointment.professionalName}\n\nEsta acción no se puede deshacer.`;
    const buttons: WhatsAppButton[] = [
      { id: 'cancel_yes', title: 'Sí, cancelar' },
      { id: 'cancel_no', title: 'No, mantener' },
    ];

    await this.whatsappService.sendButtons(phoneNumber, text, buttons);
  }

  private async handleCancelling(
    phoneNumber: string,
    message: string,
    patient: PatientInfo,
    context: BotContext,
  ): Promise<void> {
    const sessionId =
      (await this.findSessionByPhoneAndTenant(phoneNumber, patient.tenantId))?.id ?? '';

    if (message === 'cancel_yes' || message === 'sí' || message === 'si') {
      const appointmentId = context.appointmentId;
      if (appointmentId) {
        await this.cancelAppointment(phoneNumber, appointmentId, patient);
      } else {
        const appointment = await this.appointmentsService.findNextForPatient(
          patient.phone!,
          patient.tenantId,
        );
        if (appointment) {
          await this.cancelAppointment(phoneNumber, appointment.id, patient);
        }
      }
    } else {
      await this.whatsappService.sendText(
        phoneNumber,
        'Turno mantenido. Si necesitás algo más, escribinos.',
      );
      if (sessionId) {
        await this.resetToIdle(sessionId);
      }
    }
  }

  private async cancelAppointment(
    phoneNumber: string,
    appointmentId: string,
    patient: PatientInfo,
  ): Promise<void> {
    try {
      await this.appointmentsService.changeStatus(
        appointmentId,
        'cancelled',
        patient.tenantId,
        null,
      );
    } catch {
      // Already cancelled or invalid transition
    }

    await this.whatsappService.sendText(
      phoneNumber,
      '✅ Tu turno fue cancelado exitosamente. Si necesitás uno nuevo, escribinos cuando quieras.',
    );

    const session = await this.findSessionByPhoneAndTenant(phoneNumber, patient.tenantId);
    if (session) {
      await this.resetToIdle(session.id);
    }
  }

  // ─── Session helpers ───────────────────────────────────────────────────

  private async findPatientByPhone(
    phoneNumber: string,
    tenantId: string,
  ): Promise<PatientInfo | null> {
    const db = this.dbService.db;
    const cleanPhone = phoneNumber.replace('@c.us', '').replace('@s.whatsapp.net', '');

    const rows = await db
      .select({
        id: patients.id,
        firstName: patients.firstName,
        lastName: patients.lastName,
        phone: patients.phone,
      })
      .from(patients)
      .where(and(eq(patients.phone, cleanPhone), eq(patients.tenantId, tenantId)))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0]!;
    return {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      phone: row.phone,
      tenantId,
    };
  }

  private async getOrCreateSession(
    phoneNumber: string,
    tenantId: string,
    patientId: string,
  ): Promise<SessionRow | null> {
    const db = this.dbService.db;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_MINUTES * 60 * 1000);

    const existing = await db
      .select()
      .from(whatsappBotSessions)
      .where(
        and(
          eq(whatsappBotSessions.phoneNumber, phoneNumber),
          eq(whatsappBotSessions.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return toSessionRow(existing[0]!);
    }

    const created = await db
      .insert(whatsappBotSessions)
      .values({
        tenantId,
        phoneNumber,
        patientId,
        currentState: BotState.IDLE,
        contextData: {},
        lastInteractionAt: now,
        expiresAt,
      })
      .returning();

    if (!created[0]) return null;
    return toSessionRow(created[0]);
  }

  private async findSessionByPhoneAndTenant(
    phoneNumber: string,
    tenantId: string,
  ): Promise<SessionRow | null> {
    const db = this.dbService.db;
    const session = await db
      .select()
      .from(whatsappBotSessions)
      .where(
        and(
          eq(whatsappBotSessions.phoneNumber, phoneNumber),
          eq(whatsappBotSessions.tenantId, tenantId),
        ),
      )
      .limit(1);

    return session[0] ? toSessionRow(session[0]) : null;
  }

  private isSessionExpired(session: SessionRow): boolean {
    return new Date() > new Date(session.expiresAt);
  }

  private async resetSession(sessionId: string): Promise<void> {
    const db = this.dbService.db;
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000);

    await db
      .update(whatsappBotSessions)
      .set({
        currentState: BotState.IDLE,
        contextData: {},
        lastInteractionAt: new Date(),
        expiresAt,
      })
      .where(eq(whatsappBotSessions.id, sessionId));
  }

  private async resetToIdle(sessionId: string): Promise<void> {
    await this.resetSession(sessionId);
  }

  private async updateSessionLastInteraction(sessionId: string): Promise<void> {
    const db = this.dbService.db;
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000);

    await db
      .update(whatsappBotSessions)
      .set({
        lastInteractionAt: new Date(),
        expiresAt,
      })
      .where(eq(whatsappBotSessions.id, sessionId));
  }
}
