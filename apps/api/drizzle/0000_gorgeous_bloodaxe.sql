CREATE TYPE "public"."account_state" AS ENUM('active', 'inactive', 'locked', 'pending_password_change');--> statement-breakpoint
CREATE TYPE "public"."action" AS ENUM('view_module', 'view_list', 'view_detail', 'view_sensitive', 'view_audit', 'create', 'edit', 'change_status', 'emit', 'cancel', 'admin_catalog', 'admin_users', 'admin_roles_permissions', 'admin_policies', 'close_session_admin');--> statement-breakpoint
CREATE TYPE "public"."audit_event_type" AS ENUM('login_success', 'login_failure', 'logout', 'session_expired', 'session_refreshed', 'session_closed_by_admin', 'password_changed', 'password_forced_change', 'recovery_requested', 'recovery_completed', 'account_locked', 'account_unlocked', 'account_rehabilitated', 'access_denied', 'permission_granted', 'permission_revoked', 'session_policy_updated', 'audit_exported', 'unusual_access_detected', 'permission_review_confirmed', 'permission_review_revoked', 'permission_review_expired', 'plan_quota_blocked');--> statement-breakpoint
CREATE TYPE "public"."base_role" AS ENUM('admin', 'profesional', 'asistente', 'profesional_supervisor');--> statement-breakpoint
CREATE TYPE "public"."module" AS ENUM('dashboard', 'patients', 'turns', 'caller', 'clinical_history', 'odontogram', 'prescriptions', 'budgets', 'mutuals', 'deposits', 'patient_accounting', 'general_accounting', 'professionals', 'assistants', 'system_config', 'users_roles_permissions', 'audit_access');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'confirmed', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."scope" AS ENUM('none', 'own', 'assigned', 'operational_institutional', 'supervision', 'institutional_total');--> statement-breakpoint
CREATE TYPE "public"."tenant_plan" AS ENUM('free', 'basic', 'professional', 'enterprise');--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" "audit_event_type" NOT NULL,
	"actor_id" uuid NOT NULL,
	"actor_email" varchar(255) NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"user_agent" text NOT NULL,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_recovery_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_recovery_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "permission_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"reviewer_id" uuid,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inactivity_timeout_minutes" integer DEFAULT 30 NOT NULL,
	"max_session_duration_hours" integer DEFAULT 8 NOT NULL,
	"max_concurrent_sessions" integer DEFAULT 3 NOT NULL,
	"updated_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"user_agent" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"closed_by" uuid,
	"close_reason" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"schema" varchar(100) NOT NULL,
	"plan" "tenant_plan" DEFAULT 'free' NOT NULL,
	"max_active_professionals" integer DEFAULT 1 NOT NULL,
	"active_professional_count" integer DEFAULT 0 NOT NULL,
	"grace_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_schema_unique" UNIQUE("schema")
);
--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"module" "module" NOT NULL,
	"action" "action" NOT NULL,
	"scope" "scope" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"role" "base_role" NOT NULL,
	"state" "account_state" DEFAULT 'active' NOT NULL,
	"token_version" integer DEFAULT 0 NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_recovery_tokens" ADD CONSTRAINT "password_recovery_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_reviews" ADD CONSTRAINT "permission_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_reviews" ADD CONSTRAINT "permission_reviews_permission_id_user_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."user_permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_reviews" ADD CONSTRAINT "permission_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_policies" ADD CONSTRAINT "session_policies_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;