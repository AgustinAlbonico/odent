import {
  boolean,
  integer,
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

export const baseRoleEnum = pgEnum('base_role', [
  'admin',
  'profesional',
  'asistente',
  'profesional_supervisor',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: baseRoleEnum('role').notNull(),
  state: accountStateEnum('state').notNull().default('active'),
  tokenVersion: integer('token_version').notNull().default(0),
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
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

// ─── Relations ────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  permissions: many(userPermissions),
  recoveryTokens: many(passwordRecoveryTokens),
  auditEvents: many(auditEvents),
  permissionReviews: many(permissionReviews),
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
