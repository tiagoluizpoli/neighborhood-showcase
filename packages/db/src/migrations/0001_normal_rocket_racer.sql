CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE "condominium" ADD COLUMN "latitude" numeric;--> statement-breakpoint
ALTER TABLE "condominium" ADD COLUMN "longitude" numeric;--> statement-breakpoint
ALTER TABLE "condominium" ADD COLUMN "geog" geography(Point, 4326);--> statement-breakpoint
ALTER TABLE "provider_location" ADD COLUMN "latitude" numeric;--> statement-breakpoint
ALTER TABLE "provider_location" ADD COLUMN "longitude" numeric;--> statement-breakpoint
ALTER TABLE "provider_location" ADD COLUMN "geog" geography(Point, 4326);