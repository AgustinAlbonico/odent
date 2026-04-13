CREATE TYPE "public"."appointment_audit_action" AS ENUM('created', 'updated', 'status_changed', 'cancelled', 'rescheduled');--> statement-breakpoint
CREATE TYPE "public"."appointment_exception_type" AS ENUM('full_day', 'time_range');--> statement-breakpoint
CREATE TYPE "public"."appointment_source" AS ENUM('desk', 'whatsapp', 'web');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'waiting', 'attended', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."holiday_type" AS ENUM('national', 'institutional');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_bot_state" AS ENUM('idle', 'confirming', 'rescheduling', 'rescheduling_select_date', 'rescheduling_select_time', 'cancelling');--> statement-breakpoint
CREATE TABLE "appointment_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"appointment_id" uuid NOT NULL,
	"action" "appointment_audit_action" NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"changed_by" uuid,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"start_time" varchar(5),
	"end_time" varchar(5),
	"reason" varchar(200) NOT NULL,
	"type" "appointment_exception_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"slot_duration_minutes" integer DEFAULT 30 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"professional_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"mutual_id" uuid,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'pending' NOT NULL,
	"source" "appointment_source" DEFAULT 'desk' NOT NULL,
	"notes" text,
	"reminder_sent_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"cancelled_by" uuid,
	"cancellation_reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"name" varchar(200) NOT NULL,
	"type" "holiday_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_bot_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"phone_number" varchar(30) NOT NULL,
	"patient_id" uuid,
	"current_state" "whatsapp_bot_state" DEFAULT 'idle' NOT NULL,
	"context_data" jsonb,
	"last_interaction_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
