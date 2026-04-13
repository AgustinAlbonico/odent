import { z } from 'zod';

// ─── Login ────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Password Change (voluntary) ──────────────────────
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Contraseña actual requerida'),
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Al menos una mayúscula')
      .regex(/[a-z]/, 'Al menos una minúscula')
      .regex(/[0-9]/, 'Al menos un número'),
    confirmPassword: z.string().min(1, 'Confirmación requerida'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

// ─── Forced Password Change ───────────────────────────
export const forcedPasswordChangeSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Al menos una mayúscula')
      .regex(/[a-z]/, 'Al menos una minúscula')
      .regex(/[0-9]/, 'Al menos un número'),
    confirmPassword: z.string().min(1, 'Confirmación requerida'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type ForcedPasswordChangeInput = z.infer<typeof forcedPasswordChangeSchema>;

// ─── Password Recovery ────────────────────────────────
export const recoveryRequestSchema = z.object({
  email: z.email('Email inválido'),
});

export type RecoveryRequestInput = z.infer<typeof recoveryRequestSchema>;

export const recoveryVerifySchema = z.object({
  token: z.string().min(1, 'Token requerido'),
});

export type RecoveryVerifyInput = z.infer<typeof recoveryVerifySchema>;

export const recoveryResetSchema = z
  .object({
    token: z.string().min(1, 'Token requerido'),
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Al menos una mayúscula')
      .regex(/[a-z]/, 'Al menos una minúscula')
      .regex(/[0-9]/, 'Al menos un número'),
    confirmPassword: z.string().min(1, 'Confirmación requerida'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type RecoveryResetInput = z.infer<typeof recoveryResetSchema>;

// ─── Session Policy (admin configurable) ──────────────
export const sessionPolicySchema = z
  .object({
    inactivityTimeoutMinutes: z.number().int().min(5).max(480).optional(),
    maxSessionDurationHours: z.number().int().min(1).max(24).optional(),
    maxConcurrentSessions: z.number().int().min(1).max(10).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one policy field must be provided',
  });

export type SessionPolicyInput = z.infer<typeof sessionPolicySchema>;

// Full resolved policy (all fields guaranteed) — used at runtime
export type ResolvedSessionPolicy = {
  inactivityTimeoutMinutes: number;
  maxSessionDurationHours: number;
  maxConcurrentSessions: number;
};

// ─── Audit Export ─────────────────────────────────────
export const auditExportSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  eventType: z.string().optional(),
  actorId: z.string().uuid().optional(),
});

export type AuditExportInput = z.infer<typeof auditExportSchema>;

// ─── Profile Update (self-service) ───────────────────
export const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').max(100).optional(),
  lastName: z.string().min(1, 'El apellido es requerido').max(100).optional(),
  phone: z.string().max(50).optional().or(z.literal('')),
  licenseNumber: z.string().max(50).optional().or(z.literal('')),
  specialty: z.string().max(200).optional().or(z.literal('')),
  dni: z.string().max(20).optional().or(z.literal('')),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
