ALTER TABLE "order" DROP CONSTRAINT "order_status_ck";--> statement-breakpoint
ALTER TABLE "order" DROP CONSTRAINT "order_closed_ck";--> statement-breakpoint
ALTER TABLE "order" DROP CONSTRAINT "order_delivered_ck";--> statement-breakpoint
UPDATE "order" SET "status" = 'closed' WHERE "closed_at" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_status_ck" CHECK ("order"."status" in ('not_started','printing','finished','delivered','closed','damaged'));--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_closed_ck" CHECK (("order"."status" = 'closed' and "order"."closed_at" is not null and "order"."delivered_at" is not null) or ("order"."status" <> 'closed' and "order"."closed_at" is null));--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_delivered_ck" CHECK (("order"."status" in ('delivered','closed') and "order"."delivered_at" is not null and "order"."confirmed_at" is not null) or ("order"."status" not in ('delivered','closed') and "order"."delivered_at" is null));