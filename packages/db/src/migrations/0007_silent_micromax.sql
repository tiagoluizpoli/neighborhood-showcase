CREATE TABLE "provider_profile" (
	"provider_id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"social_links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_provider_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provider_profile" ADD CONSTRAINT "provider_profile_provider_id_user_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "provider_profile" (
	"provider_id",
	"display_name",
	"avatar_url",
	"social_links",
	"is_provider_visible",
	"created_at",
	"updated_at"
)
SELECT
	"id",
	"name",
	"image",
	"social_links",
	"is_provider_visible",
	"created_at",
	"updated_at"
FROM "user"
ON CONFLICT ("provider_id") DO NOTHING;
