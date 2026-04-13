import { z } from 'zod';

// ─── Enums ──────────────────────────────────────────────
export const appointmentStatusEnum = z.enum([
  'pending',
  'confirmed',
  'waiting',
  'attended',
  'cancelled',
  'no_show',
]);

export const appointmentSourceEnum = z.enum(['desk', 'whatsapp', 'web']);

// ─── Create Appointment ───────────────────────────────
export const createAppointmentSchema = z.object({
  professionalId: z.string().uuid('ID de profesional inválido'),
  patientId: z.string().uuid('ID de paciente inválido'),
  mutualId: z.string().uuid('ID de mutual inválido').optional().or(z.literal('')),
  startAt: z.string().datetime('Fecha y hora de inicio inválida'),
  endAt: z.string().datetime('Fecha y hora de fin inválida'),
  notes: z.string().max(1000, 'Notas máximo 1000 caracteres').optional().or(z.literal('')),
  source: appointmentSourceEnum.default('desk'),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

// ─── Update Appointment ───────────────────────────────
export const updateAppointmentSchema = z.object({
  professionalId: z.string().uuid('ID de profesional inválido').optional(),
  patientId: z.string().uuid('ID de paciente inválido').optional(),
  mutualId: z.string().uuid('ID de mutual inválido').optional().or(z.literal('')),
  startAt: z.string().datetime('Fecha y hora de inicio inválida').optional(),
  endAt: z.string().datetime('Fecha y hora de fin inválida').optional(),
  notes: z.string().max(1000, 'Notas máximo 1000 caracteres').optional().or(z.literal('')),
  status: appointmentStatusEnum.optional(),
});

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

// ─── Query Appointments ───────────────────────────────
export const queryAppointmentsSchema = z.object({
  professionalId: z.string().uuid('ID de profesional inválido').optional(),
  patientId: z.string().uuid('ID de paciente inválido').optional(),
  status: z
    .union([
      appointmentStatusEnum,
      z.string().transform((val) => {
        const items = val.split(',').map((s) => s.trim());
        return items as [string, ...string[]];
      }),
    ])
    .optional(),
  dateFrom: z.string().date('Fecha inválida').optional(),
  dateTo: z.string().date('Fecha inválida').optional(),
  mutualId: z.string().uuid('ID de mutual inválido').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  includeCancelled: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type QueryAppointmentsInput = z.infer<typeof queryAppointmentsSchema>;

// ─── Change Appointment Status ────────────────────────
export const changeAppointmentStatusSchema = z.object({
  status: appointmentStatusEnum,
  reason: z.string().max(500, 'Motivo máximo 500 caracteres').optional().or(z.literal('')),
});

export type ChangeAppointmentStatusInput = z.infer<typeof changeAppointmentStatusSchema>;
