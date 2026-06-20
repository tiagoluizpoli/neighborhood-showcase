CREATE EXTENSION IF NOT EXISTS postgis;--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'SYSTEM_MANAGER', 'ADMINISTRATOR');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'BANNED');--> statement-breakpoint
CREATE TYPE "public"."analytics_event_type" AS ENUM('IMPRESSION', 'CONTACT_CLICK');--> statement-breakpoint
CREATE TYPE "public"."analytics_target_type" AS ENUM('WHATSAPP', 'INSTAGRAM', 'WEBSITE');--> statement-breakpoint
CREATE TYPE "public"."announcement_contact_mode" AS ENUM('inherit', 'custom');--> statement-breakpoint
CREATE TYPE "public"."announcement_status" AS ENUM('DRAFT', 'PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."assignment_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."assignment_type" AS ENUM('RESIDENT', 'MODERATOR');--> statement-breakpoint
CREATE TYPE "public"."condominium_status" AS ENUM('PENDING_APPROVAL', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'PAID', 'EXPIRED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."provider_location_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."provider_location_type" AS ENUM('RESIDENT', 'MODERATOR', 'EXTERNAL');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('FRAUDE_GOLPE', 'ASSEDIO_OFENSIVO', 'SPAM', 'SERVICO_ILEGAL', 'OUTROS');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blacklisted_identifier" (
	"id" text PRIMARY KEY NOT NULL,
	"cpf_hash" text NOT NULL,
	"reason" text NOT NULL,
	"banned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blacklisted_identifier_cpf_hash_unique" UNIQUE("cpf_hash")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"cpf_hash" text,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"phone" text,
	"social_links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_provider_visible" boolean DEFAULT true NOT NULL,
	"language" text DEFAULT 'pt-BR' NOT NULL,
	"theme" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_cpf_hash_unique" UNIQUE("cpf_hash")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "address" (
	"id" text PRIMARY KEY NOT NULL,
	"cep" text NOT NULL,
	"street" text NOT NULL,
	"neighborhood" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_event" (
	"id" text PRIMARY KEY NOT NULL,
	"announcement_id" text NOT NULL,
	"event_type" "analytics_event_type" NOT NULL,
	"target_type" "analytics_target_type",
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"provider_location_id" text,
	"condominium_id" text,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text NOT NULL,
	"price_cents" integer,
	"image_url" text NOT NULL,
	"category_id" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"contact_mode" "announcement_contact_mode" DEFAULT 'inherit' NOT NULL,
	"contact_custom" jsonb,
	"show_verified_badge" boolean DEFAULT false NOT NULL,
	"flagged_for_review" boolean DEFAULT false NOT NULL,
	"status" "announcement_status" DEFAULT 'DRAFT' NOT NULL,
	"paid_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"suspension_reason" text
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "condominium" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"cep" text NOT NULL,
	"address_id" text,
	"number" text,
	"contact_info" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "condominium_status" DEFAULT 'PENDING_APPROVAL' NOT NULL,
	"created_by" text NOT NULL,
	"proof_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"latitude" numeric,
	"longitude" numeric,
	"geog" geography(Point, 4326)
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"announcement_id" text NOT NULL,
	"billing_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"pix_qr_code" text,
	"pix_copy_paste" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_location" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"type" "provider_location_type" NOT NULL,
	"status" "provider_location_status" DEFAULT 'PENDING' NOT NULL,
	"condominium_id" text,
	"address_id" text,
	"number" text,
	"complement" text,
	"proof_file" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"latitude" numeric,
	"longitude" numeric,
	"geog" geography(Point, 4326)
);
--> statement-breakpoint
CREATE TABLE "provider_profile" (
	"provider_id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"company_name" text,
	"trade_name" text,
	"logo_url" text,
	"banner_url" text,
	"public_description" text,
	"primary_phone" text DEFAULT '' NOT NULL,
	"call_enabled" boolean DEFAULT false NOT NULL,
	"contact_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_provider_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report" (
	"id" text PRIMARY KEY NOT NULL,
	"reporter_id" text NOT NULL,
	"announcement_id" text NOT NULL,
	"reason" "report_reason" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reporter_announcement_unique" UNIQUE("reporter_id","announcement_id")
);
--> statement-breakpoint
CREATE TABLE "role_change_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text NOT NULL,
	"target_user_id" text NOT NULL,
	"previous_role" text NOT NULL,
	"new_role" text NOT NULL,
	"condominium_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_event" ADD CONSTRAINT "analytics_event_announcement_id_announcement_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_provider_id_user_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_provider_location_id_provider_location_id_fk" FOREIGN KEY ("provider_location_id") REFERENCES "public"."provider_location"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_condominium_id_condominium_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominium"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condominium" ADD CONSTRAINT "condominium_address_id_address_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."address"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condominium" ADD CONSTRAINT "condominium_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_announcement_id_announcement_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_location" ADD CONSTRAINT "provider_location_provider_id_user_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_location" ADD CONSTRAINT "provider_location_condominium_id_condominium_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominium"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_location" ADD CONSTRAINT "provider_location_address_id_address_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."address"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_profile" ADD CONSTRAINT "provider_profile_provider_id_user_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_announcement_id_announcement_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_change_log" ADD CONSTRAINT "role_change_log_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_change_log" ADD CONSTRAINT "role_change_log_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_change_log" ADD CONSTRAINT "role_change_log_condominium_id_condominium_id_fk" FOREIGN KEY ("condominium_id") REFERENCES "public"."condominium"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");
--> statement-breakpoint
INSERT INTO "category" ("id", "slug", "name", "display_order", "is_active", "created_at") VALUES
('cat-alimentacao', 'alimentacao', 'Alimentação', 1, true, now()),
('cat-servicos', 'servicos', 'Serviços', 2, true, now()),
('cat-produtos', 'produtos', 'Produtos', 3, true, now()),
('cat-vagas', 'vagas', 'Vagas', 4, true, now()),
('cat-eventos', 'eventos', 'Eventos', 5, true, now()),
('cat-outros', 'outros', 'Outros', 6, true, now())
ON CONFLICT ("id") DO NOTHING;
