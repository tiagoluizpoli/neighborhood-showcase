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
INSERT INTO "category" ("id", "slug", "name", "display_order", "is_active", "created_at") VALUES
('cat-alimentacao', 'alimentacao', 'Alimentação', 1, true, now()),
('cat-servicos', 'servicos', 'Serviços', 2, true, now()),
('cat-produtos', 'produtos', 'Produtos', 3, true, now()),
('cat-vagas', 'vagas', 'Vagas', 4, true, now()),
('cat-eventos', 'eventos', 'Eventos', 5, true, now()),
('cat-outros', 'outros', 'Outros', 6, true, now())
ON CONFLICT ("id") DO NOTHING;

--> statement-breakpoint
ALTER TABLE "announcement" ADD COLUMN "category_id" text;

--> statement-breakpoint
UPDATE "announcement" SET "category_id" = 
  CASE 
    WHEN lower("category") LIKE '%alimenta%' THEN 'cat-alimentacao'
    WHEN lower("category") LIKE '%servi%' THEN 'cat-servicos'
    WHEN lower("category") LIKE '%produt%' THEN 'cat-produtos'
    WHEN lower("category") LIKE '%vaga%' THEN 'cat-vagas'
    WHEN lower("category") LIKE '%evento%' THEN 'cat-eventos'
    ELSE 'cat-outros'
  END;

--> statement-breakpoint
UPDATE "announcement" SET "category_id" = 'cat-outros' WHERE "category_id" IS NULL;

--> statement-breakpoint
ALTER TABLE "announcement" ALTER COLUMN "category_id" SET NOT NULL;

--> statement-breakpoint
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "announcement" DROP COLUMN "category";