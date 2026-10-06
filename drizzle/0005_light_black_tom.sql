ALTER TABLE "customer" DROP CONSTRAINT "customer_required_ck";--> statement-breakpoint
ALTER TABLE "customer" ALTER COLUMN "contact_phone" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_required_ck" CHECK (length(trim("customer"."name")) > 0);