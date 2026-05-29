CREATE TABLE "blacklisted_identifier" (
	"id" text PRIMARY KEY NOT NULL,
	"cpf_hash" text NOT NULL,
	"reason" text NOT NULL,
	"banned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blacklisted_identifier_cpf_hash_unique" UNIQUE("cpf_hash")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "cpf_hash" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'PROVIDER' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "status" text DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_cpf_hash_unique" UNIQUE("cpf_hash");