import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Tenants (institutions) — public schema ───────────
export const tenantPlanEnum = pgEnum('tenant_plan', [
  'free',
  'basic',
  'professional',
  'enterprise',
]);

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  schema: varchar('schema', { length: 100 }).notNull().unique(),
  plan: tenantPlanEnum('plan').notNull().default('free'),
  maxActiveProfessionals: integer('max_active_professionals').notNull().default(1),
  activeProfessionalCount: integer('active_professional_count').notNull().default(0),
  gracePeriodEnd: timestamp('grace_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Users — tenant schema ────────────────────────────
export const accountStateEnum = pgEnum('account_state', [
  'active',
  'inactive',
  'locked',
  'pending_password_change',
]);

export const baseRoleEnum = pgEnum('base_role', ['superadmin', 'profesional', 'recepcionista']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: baseRoleEnum('role').notNull(),
  state: accountStateEnum('state').notNull().default('active'),
  tenantId: uuid('tenant_id'),
  tokenVersion: integer('token_version').notNull().default(0),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  photoUrl: varchar('photo_url', { length: 500 }),
  phone: varchar('phone', { length: 50 }),
  licenseNumber: varchar('license_number', { length: 50 }),
  specialty: varchar('specialty', { length: 200 }),
  dni: varchar('dni', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Sessions — tenant schema ─────────────────────────
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  userAgent: text('user_agent').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  closedBy: uuid('closed_by'),
  closeReason: varchar('close_reason', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Password Recovery Tokens — tenant schema ─────────
export const passwordRecoveryTokens = pgTable('password_recovery_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Audit Events — tenant schema ─────────────────────
export const auditEventTypeEnum = pgEnum('audit_event_type', [
  'login_success',
  'login_failure',
  'logout',
  'session_expired',
  'session_refreshed',
  'session_closed_by_admin',
  'password_changed',
  'password_forced_change',
  'recovery_requested',
  'recovery_completed',
  'account_locked',
  'account_unlocked',
  'account_rehabilitated',
  'access_denied',
  'permission_granted',
  'permission_revoked',
  'session_policy_updated',
  'audit_exported',
  'unusual_access_detected',
  'permission_review_confirmed',
  'permission_review_revoked',
  'permission_review_expired',
  'plan_quota_blocked',
]);

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  eventType: auditEventTypeEnum('event_type').notNull(),
  actorId: uuid('actor_id')
    .notNull()
    .references(() => users.id),
  actorEmail: varchar('actor_email', { length: 255 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  userAgent: text('user_agent').notNull(),
  metadata: text('metadata'), // JSON string
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Session Policies — tenant schema ─────────────────
export const sessionPolicies = pgTable('session_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  inactivityTimeoutMinutes: integer('inactivity_timeout_minutes').notNull().default(30),
  maxSessionDurationHours: integer('max_session_duration_hours').notNull().default(8),
  maxConcurrentSessions: integer('max_concurrent_sessions').notNull().default(3),
  updatedBy: uuid('updated_by')
    .notNull()
    .references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── User Permissions — tenant schema ─────────────────
export const moduleEnum = pgEnum('module', [
  'dashboard',
  'patients',
  'turns',
  'caller',
  'clinical_history',
  'odontogram',
  'prescriptions',
  'budgets',
  'mutuals',
  'deposits',
  'patient_accounting',
  'general_accounting',
  'professionals',
  'assistants',
  'system_config',
  'users_roles_permissions',
  'audit_access',
]);

export const actionEnum = pgEnum('action', [
  'view_module',
  'view_list',
  'view_detail',
  'view_sensitive',
  'view_audit',
  'create',
  'edit',
  'change_status',
  'emit',
  'cancel',
  'admin_catalog',
  'admin_users',
  'admin_roles_permissions',
  'admin_policies',
  'close_session_admin',
]);

export const scopeEnum = pgEnum('scope', [
  'none',
  'own',
  'assigned',
  'operational_institutional',
  'supervision',
  'institutional_total',
]);

export const userPermissions = pgTable('user_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  module: moduleEnum('module').notNull(),
  action: actionEnum('action').notNull(),
  scope: scopeEnum('scope').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Permission Reviews — tenant schema ───────────────
export const reviewStatusEnum = pgEnum('review_status', [
  'pending',
  'confirmed',
  'revoked',
  'expired',
]);

export const permissionReviews = pgTable('permission_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id')
    .notNull()
    .references(() => userPermissions.id, { onDelete: 'cascade' }),
  reviewerId: uuid('reviewer_id').references(() => users.id),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  status: reviewStatusEnum('status').notNull().default('pending'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Patients — tenant schema ─────────────────────────
export const patientStateEnum = pgEnum('patient_state', ['active', 'inactive']);
export const patientSexEnum = pgEnum('patient_sex', ['male', 'female', 'other']);
export const bloodGroupEnum = pgEnum('blood_group', ['A', 'B', 'AB', 'O']);
export const rhFactorEnum = pgEnum('rh_factor', ['positive', 'negative']);

export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  dni: varchar('dni', { length: 20 }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  sex: patientSexEnum('sex'),
  birthDate: timestamp('birth_date', { mode: 'date' }),
  bloodGroup: bloodGroupEnum('blood_group'),
  rhFactor: rhFactorEnum('rh_factor'),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 30 }),
  address: text('address'),
  postalCode: varchar('postal_code', { length: 10 }),
  notes: text('notes'),
  state: patientStateEnum('state').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Patient Mutuals — tenant schema ──────────────────
export const patientMutuals = pgTable('patient_mutuals', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patients.id, { onDelete: 'cascade' }),
  mutualId: uuid('mutual_id').references(() => mutuals.id),
  mutualName: varchar('mutual_name', { length: 150 }).notNull(),
  planName: varchar('plan_name', { length: 150 }).notNull(),
  affiliateNumber: varchar('affiliate_number', { length: 50 }).notNull(),
  coveragePercent: integer('coverage_percent').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Mutuals Catalog — tenant schema ─────────────────
export const mutuals = pgTable('mutuals', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 200 }).notNull().unique(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  phone: varchar('phone', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Professional Mutuals — tenant schema ─────────────
export const professionalMutuals = pgTable('professional_mutuals', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  professionalId: uuid('professional_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  mutualId: uuid('mutual_id')
    .notNull()
    .references(() => mutuals.id, { onDelete: 'cascade' }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────
export const patientsRelations = relations(patients, ({ many }) => ({
  mutuals: many(patientMutuals),
}));

export const patientMutualsRelations = relations(patientMutuals, ({ one }) => ({
  patient: one(patients, {
    fields: [patientMutuals.patientId],
    references: [patients.id],
  }),
  mutual: one(mutuals, {
    fields: [patientMutuals.mutualId],
    references: [mutuals.id],
  }),
}));

export const mutualsRelations = relations(mutuals, ({ many }) => ({
  patientMutuals: many(patientMutuals),
  professionalMutuals: many(professionalMutuals),
}));

export const professionalMutualsRelations = relations(professionalMutuals, ({ one }) => ({
  professional: one(users, {
    fields: [professionalMutuals.professionalId],
    references: [users.id],
  }),
  mutual: one(mutuals, {
    fields: [professionalMutuals.mutualId],
    references: [mutuals.id],
  }),
}));

// ─── User Relations ──────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  permissions: many(userPermissions),
  recoveryTokens: many(passwordRecoveryTokens),
  auditEvents: many(auditEvents),
  permissionReviews: many(permissionReviews),
  professionalMutuals: many(professionalMutuals),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const passwordRecoveryTokensRelations = relations(passwordRecoveryTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordRecoveryTokens.userId],
    references: [users.id],
  }),
}));

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  actor: one(users, {
    fields: [auditEvents.actorId],
    references: [users.id],
  }),
}));

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
}));

export const permissionReviewsRelations = relations(permissionReviews, ({ one }) => ({
  user: one(users, {
    fields: [permissionReviews.userId],
    references: [users.id],
  }),
  permission: one(userPermissions, {
    fields: [permissionReviews.permissionId],
    references: [userPermissions.id],
  }),
  reviewer: one(users, {
    fields: [permissionReviews.reviewerId],
    references: [users.id],
    relationName: 'reviewer',
  }),
}));

// ─── Appointments Module — tenant schema ──────────────────────────────

// T001: Appointments enums
export const appointmentStatusEnum = pgEnum('appointment_status', [
  'pending',
  'confirmed',
  'waiting',
  'attended',
  'cancelled',
  'no_show',
]);

export const appointmentSourceEnum = pgEnum('appointment_source', ['desk', 'whatsapp', 'web']);

// T003: Appointment exceptions enum
export const appointmentExceptionTypeEnum = pgEnum('appointment_exception_type', [
  'full_day',
  'time_range',
]);

// T004: Holidays enum
export const holidayTypeEnum = pgEnum('holiday_type', ['national', 'institutional']);

// T005: Appointment audit log enum
export const appointmentAuditActionEnum = pgEnum('appointment_audit_action', [
  'created',
  'updated',
  'status_changed',
  'cancelled',
  'rescheduled',
]);

// T006: WhatsApp bot state enum
export const whatsappBotStateEnum = pgEnum('whatsapp_bot_state', [
  'idle',
  'confirming',
  'rescheduling',
  'rescheduling_select_date',
  'rescheduling_select_time',
  'cancelling',
]);

// ─── T001: Appointments (turnos) ──────────────────────────────────────
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  professionalId: uuid('professional_id').notNull(),
  patientId: uuid('patient_id').notNull(),
  mutualId: uuid('mutual_id'),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  status: appointmentStatusEnum('status').notNull().default('pending'),
  source: appointmentSourceEnum('source').notNull().default('desk'),
  notes: text('notes'),
  reminderSentAt: timestamp('reminder_sent_at', { withTimezone: true }),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  cancelledBy: uuid('cancelled_by'),
  cancellationReason: text('cancellation_reason'),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── T002: Appointment Schedules (horarios de atención) ───────────────
export const appointmentSchedules = pgTable('appointment_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  professionalId: uuid('professional_id').notNull(),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(),
  endTime: varchar('end_time', { length: 5 }).notNull(),
  slotDurationMinutes: integer('slot_duration_minutes').notNull().default(30),
  isActive: boolean('is_active').notNull().default(true),
});

// ─── T003: Appointment Exceptions (excepciones/bloqueos) ──────────────
export const appointmentExceptions = pgTable('appointment_exceptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  professionalId: uuid('professional_id').notNull(),
  startDate: timestamp('start_date', { mode: 'date' }).notNull(),
  endDate: timestamp('end_date', { mode: 'date' }).notNull(),
  startTime: varchar('start_time', { length: 5 }),
  endTime: varchar('end_time', { length: 5 }),
  reason: varchar('reason', { length: 200 }).notNull(),
  type: appointmentExceptionTypeEnum('type').notNull(),
});

// ─── T004: Holidays (feriados) ────────────────────────────────────────
export const holidays = pgTable('holidays', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  date: timestamp('date', { mode: 'date' }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  type: holidayTypeEnum('type').notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

// ─── T005: Appointment Audit Log (trazabilidad) ───────────────────────
export const appointmentAuditLog = pgTable('appointment_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  appointmentId: uuid('appointment_id').notNull(),
  action: appointmentAuditActionEnum('action').notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  changedBy: uuid('changed_by'),
  changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── T006: WhatsApp Bot Sessions (sesiones del bot) ───────────────────
export const whatsappBotSessions = pgTable('whatsapp_bot_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  phoneNumber: varchar('phone_number', { length: 30 }).notNull(),
  patientId: uuid('patient_id'),
  currentState: whatsappBotStateEnum('current_state').notNull().default('idle'),
  contextData: jsonb('context_data'),
  lastInteractionAt: timestamp('last_interaction_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

// ─── Appointments Relations ───────────────────────────────────────────
export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  professional: one(users, {
    fields: [appointments.professionalId],
    references: [users.id],
  }),
}));
