CREATE TABLE "provider" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "announcement" DROP CONSTRAINT "announcement_provider_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "provider_location" DROP CONSTRAINT "provider_location_provider_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "provider_profile" DROP CONSTRAINT "provider_profile_provider_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "provider" ADD CONSTRAINT "provider_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_location" ADD CONSTRAINT "provider_location_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_profile" ADD CONSTRAINT "provider_profile_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE cascade ON UPDATE no action;