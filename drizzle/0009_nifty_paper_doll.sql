CREATE TABLE "quote_image_asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	CONSTRAINT "quote_image_dimensions_ck" CHECK ("quote_image_asset"."width" between 1 and 1600 and "quote_image_asset"."height" between 1 and 1600),
	CONSTRAINT "quote_image_size_ck" CHECK (length("quote_image_asset"."data") between 1 and 409600)
);
--> statement-breakpoint
ALTER TABLE "quote_revision" ADD COLUMN "images" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_image_asset" ADD CONSTRAINT "quote_image_asset_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_image_asset" ADD CONSTRAINT "quote_image_asset_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quote_image_org_creator_date_idx" ON "quote_image_asset" USING btree ("org_id","created_by","created_at");