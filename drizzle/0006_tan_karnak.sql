ALTER TABLE "order" DROP CONSTRAINT "order_source_quote_uq";--> statement-breakpoint
ALTER TABLE "order" DROP CONSTRAINT "order_accepted_revision_uq";--> statement-breakpoint
CREATE INDEX "order_accepted_revision_idx" ON "order" USING btree ("accepted_revision_id");--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_source_quote_customer_uq" UNIQUE("org_id","source_quote_id","customer_id");