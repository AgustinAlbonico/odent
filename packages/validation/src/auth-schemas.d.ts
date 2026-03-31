import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodEmail;
    password: z.ZodString;
}, z.core.$strip>;
export type LoginInput = z.infer<typeof loginSchema>;
export declare const passwordChangeSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, z.core.$strip>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export declare const forcedPasswordChangeSchema: z.ZodObject<{
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, z.core.$strip>;
export type ForcedPasswordChangeInput = z.infer<typeof forcedPasswordChangeSchema>;
export declare const recoveryRequestSchema: z.ZodObject<{
    email: z.ZodEmail;
}, z.core.$strip>;
export type RecoveryRequestInput = z.infer<typeof recoveryRequestSchema>;
export declare const recoveryVerifySchema: z.ZodObject<{
    token: z.ZodString;
}, z.core.$strip>;
export type RecoveryVerifyInput = z.infer<typeof recoveryVerifySchema>;
export declare const recoveryResetSchema: z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, z.core.$strip>;
export type RecoveryResetInput = z.infer<typeof recoveryResetSchema>;
export declare const sessionPolicySchema: z.ZodObject<{
    inactivityTimeoutMinutes: z.ZodNumber;
    maxSessionDurationHours: z.ZodNumber;
    maxConcurrentSessions: z.ZodNumber;
}, z.core.$strip>;
export type SessionPolicyInput = z.infer<typeof sessionPolicySchema>;
export declare const auditExportSchema: z.ZodObject<{
    from: z.ZodString;
    to: z.ZodString;
    eventType: z.ZodOptional<z.ZodString>;
    actorId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type AuditExportInput = z.infer<typeof auditExportSchema>;
//# sourceMappingURL=auth-schemas.d.ts.map