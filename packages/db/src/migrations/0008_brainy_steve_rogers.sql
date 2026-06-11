ALTER TABLE "user" ADD COLUMN "language" text DEFAULT 'pt-BR' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "theme" text DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_profile" ADD COLUMN "company_name" text;--> statement-breakpoint
ALTER TABLE "provider_profile" ADD COLUMN "trade_name" text;--> statement-breakpoint
ALTER TABLE "provider_profile" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "provider_profile" ADD COLUMN "banner_url" text;--> statement-breakpoint
ALTER TABLE "provider_profile" ADD COLUMN "public_description" text;