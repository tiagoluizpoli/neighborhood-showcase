ALTER TABLE "user" ADD COLUMN "social_links" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_provider_visible" boolean DEFAULT true NOT NULL;