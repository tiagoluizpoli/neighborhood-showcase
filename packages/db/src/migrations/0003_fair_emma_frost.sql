CREATE TYPE "public"."report_reason" AS ENUM('FRAUDE_GOLPE', 'ASSEDIO_OFENSIVO', 'SPAM', 'SERVICO_ILEGAL', 'OUTROS');--> statement-breakpoint
CREATE TABLE "report" (
	"id" text PRIMARY KEY NOT NULL,
	"reporter_id" text NOT NULL,
	"announcement_id" text NOT NULL,
	"reason" "report_reason" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reporter_announcement_unique" UNIQUE("reporter_id","announcement_id")
);
--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_announcement_id_announcement_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcement"("id") ON DELETE cascade ON UPDATE no action;