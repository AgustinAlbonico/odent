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
export const sessionPolicySchema = z.object({
  inactivityTimeoutMinutes: z.number().int().min(5).max(480),
  maxSessionDurationHours: z.number().int().min(1).max(24),
  maxConcurrentSessions: z.number().int().min(1).max(10),
});

export type SessionPolicyInput = z.infer<typeof sessionPolicySchema>;

// ─── Audit Export ─────────────────────────────────────
export const auditExportSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  eventType: z.string().optional(),
  actorId: z.string().uuid().optional(),
});

export type AuditExportInput = z.infer<typeof auditExportSchema>;
