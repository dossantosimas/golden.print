CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_provider_identity_uq" UNIQUE("provider_id","account_id")
);
--> statement-breakpoint
CREATE TABLE "audit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"actor_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_settings" (
	"organization_id" uuid PRIMARY KEY NOT NULL,
	"formula_version" integer DEFAULT 1 NOT NULL,
	"machine_hour_rate" numeric(18, 6) DEFAULT '2000' NOT NULL,
	"power_kw" numeric(12, 6) DEFAULT '0.15' NOT NULL,
	"energy_kwh_rate" numeric(18, 6) DEFAULT '1100' NOT NULL,
	"contingency_rate" numeric(12, 6) DEFAULT '0.10' NOT NULL,
	"minimum_multiplier" numeric(12, 6) DEFAULT '2' NOT NULL,
	"medium_multiplier" numeric(12, 6) DEFAULT '2.5' NOT NULL,
	"high_multiplier" numeric(12, 6) DEFAULT '3' NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "settings_rates_ck" CHECK ("business_settings"."machine_hour_rate" >= 0 and "business_settings"."power_kw" >= 0 and "business_settings"."energy_kwh_rate" >= 0 and "business_settings"."contingency_rate" between 0 and 1),
	CONSTRAINT "settings_multipliers_ck" CHECK ("business_settings"."minimum_multiplier" > 0 and "business_settings"."medium_multiplier" >= "business_settings"."minimum_multiplier" and "business_settings"."high_multiplier" >= "business_settings"."medium_multiplier")
);
--> statement-breakpoint
CREATE TABLE "cash_movement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"business_date" date NOT NULL,
	"direction" text NOT NULL,
	"amount" numeric(18, 0) NOT NULL,
	"source_kind" text NOT NULL,
	"payment_id" uuid,
	"expense_id" uuid,
	"direct_cost_id" uuid,
	"independent_loss_id" uuid,
	"reference" text,
	"actor_id" text NOT NULL,
	"voided_at" timestamp with time zone,
	"void_reason" text,
	"correction_of_id" uuid,
	CONSTRAINT "cash_org_id_uq" UNIQUE("org_id","id"),
	CONSTRAINT "cash_positive_ck" CHECK ("cash_movement"."amount" > 0),
	CONSTRAINT "cash_direction_ck" CHECK ("cash_movement"."direction" in ('in','out')),
	CONSTRAINT "cash_source_ck" CHECK (num_nonnulls("cash_movement"."payment_id", "cash_movement"."expense_id", "cash_movement"."direct_cost_id", "cash_movement"."independent_loss_id") = 1 and (("cash_movement"."source_kind" = 'payment' and "cash_movement"."payment_id" is not null and "cash_movement"."direction" = 'in') or ("cash_movement"."source_kind" = 'expense' and "cash_movement"."expense_id" is not null and "cash_movement"."direction" = 'out') or ("cash_movement"."source_kind" = 'direct_cost' and "cash_movement"."direct_cost_id" is not null and "cash_movement"."direction" = 'out') or ("cash_movement"."source_kind" = 'independent_loss' and "cash_movement"."independent_loss_id" is not null and "cash_movement"."direction" = 'out')))
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"contact_phone" text NOT NULL,
	"email" text,
	"social_handle" text,
	"notes" text,
	"archived_at" timestamp with time zone,
	CONSTRAINT "customer_org_id_uq" UNIQUE("org_id","id"),
	CONSTRAINT "customer_required_ck" CHECK (length(trim("customer"."name")) > 0 and length(trim("customer"."contact_phone")) > 0)
);
--> statement-breakpoint
CREATE TABLE "direct_cost" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"order_id" uuid NOT NULL,
	"attempt_id" uuid,
	"category" text NOT NULL,
	"economic_classification" text NOT NULL,
	"cash_nature" text NOT NULL,
	"description" text NOT NULL,
	"incurred_date" date NOT NULL,
	"quantity" numeric(18, 6),
	"unit_cost" numeric(18, 6),
	"amount" numeric(18, 6) NOT NULL,
	"filament_id" uuid,
	"price_snapshot" jsonb,
	"voided_at" timestamp with time zone,
	"void_reason" text,
	"correction_of_id" uuid,
	CONSTRAINT "direct_cost_org_id_uq" UNIQUE("org_id","id"),
	CONSTRAINT "direct_cost_org_order_id_uq" UNIQUE("org_id","order_id","id"),
	CONSTRAINT "direct_cost_values_ck" CHECK ("direct_cost"."amount" > 0 and ("direct_cost"."quantity" is null or "direct_cost"."quantity" >= 0) and ("direct_cost"."unit_cost" is null or "direct_cost"."unit_cost" >= 0)),
	CONSTRAINT "direct_cost_category_ck" CHECK ("direct_cost"."category" in ('material','energy','machine','postprocess','other')),
	CONSTRAINT "direct_cost_classification_ck" CHECK ("direct_cost"."economic_classification" in ('variable','nonvariable') and "direct_cost"."cash_nature" in ('monetary','nonmonetary'))
);
--> statement-breakpoint
CREATE TABLE "document_counter" (
	"organization_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"next_value" bigint DEFAULT 1 NOT NULL,
	CONSTRAINT "document_counter_organization_id_kind_pk" PRIMARY KEY("organization_id","kind"),
	CONSTRAINT "counter_kind_ck" CHECK ("document_counter"."kind" in ('COT','PED')),
	CONSTRAINT "counter_positive_ck" CHECK ("document_counter"."next_value" > 0)
);
--> statement-breakpoint
CREATE TABLE "expense" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"expense_date" date NOT NULL,
	"description" text NOT NULL,
	"classification" text NOT NULL,
	"cost_behavior" text,
	"category" text NOT NULL,
	"amount" numeric(18, 0) NOT NULL,
	"responsible_user_id" text NOT NULL,
	"notes" text,
	"voided_at" timestamp with time zone,
	"void_reason" text,
	"correction_of_id" uuid,
	CONSTRAINT "expense_org_id_uq" UNIQUE("org_id","id"),
	CONSTRAINT "expense_positive_ck" CHECK ("expense"."amount" > 0),
	CONSTRAINT "expense_classification_ck" CHECK (("expense"."classification" = 'opex' and "expense"."cost_behavior" is not null and "expense"."cost_behavior" in ('fixed','variable')) or ("expense"."classification" = 'material_purchase' and "expense"."cost_behavior" is null))
);
--> statement-breakpoint
CREATE TABLE "filament" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"material_type" text NOT NULL,
	"color" text NOT NULL,
	"purchase_value" numeric(18, 6) NOT NULL,
	"roll_weight_g" numeric(18, 6) NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "filament_org_id_uq" UNIQUE("org_id","id"),
	CONSTRAINT "filament_values_ck" CHECK ("filament"."purchase_value" >= 0 and "filament"."roll_weight_g" > 0)
);
--> statement-breakpoint
CREATE TABLE "independent_loss" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"recognized_date" date NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(18, 6) NOT NULL,
	"actor_id" text NOT NULL,
	"origin_reference" text,
	"voided_at" timestamp with time zone,
	"void_reason" text,
	"correction_of_id" uuid,
	CONSTRAINT "loss_org_id_uq" UNIQUE("org_id","id"),
	CONSTRAINT "loss_positive_ck" CHECK ("independent_loss"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "membership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "membership_org_user_uq" UNIQUE("organization_id","user_id"),
	CONSTRAINT "membership_role_ck" CHECK ("membership"."role" in ('administrator','operator'))
);
--> statement-breakpoint
CREATE TABLE "mutation_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"actor_id" text NOT NULL,
	"operation" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"input_hash" text NOT NULL,
	"result_entity_type" text NOT NULL,
	"result_entity_id" uuid NOT NULL,
	"result_status" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mutation_request_key_uq" UNIQUE("org_id","actor_id","operation","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "order_status_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" text NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"sequence_number" bigint NOT NULL,
	"code" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"source_quote_id" uuid,
	"accepted_revision_id" uuid,
	"title" text NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"order_date" date NOT NULL,
	"promised_delivery_date" date,
	"confirmed_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"agreed_price" numeric(18, 0),
	"cost_completeness" text DEFAULT 'incomplete' NOT NULL,
	"notes" text,
	"archived_at" timestamp with time zone,
	CONSTRAINT "order_org_id_uq" UNIQUE("org_id","id"),
	CONSTRAINT "order_org_code_uq" UNIQUE("org_id","code"),
	CONSTRAINT "order_org_number_uq" UNIQUE("org_id","sequence_number"),
	CONSTRAINT "order_source_quote_uq" UNIQUE("source_quote_id"),
	CONSTRAINT "order_accepted_revision_uq" UNIQUE("accepted_revision_id"),
	CONSTRAINT "order_status_ck" CHECK ("order"."status" in ('not_started','printing','finished','delivered','damaged')),
	CONSTRAINT "order_completeness_ck" CHECK ("order"."cost_completeness" in ('incomplete','complete')),
	CONSTRAINT "order_confirmation_ck" CHECK (("order"."confirmed_at" is null and "order"."source_quote_id" is null and "order"."accepted_revision_id" is null and "order"."agreed_price" is null) or ("order"."confirmed_at" is not null and "order"."source_quote_id" is not null and "order"."accepted_revision_id" is not null and "order"."agreed_price" is not null and "order"."agreed_price" >= 0)),
	CONSTRAINT "order_delivered_ck" CHECK (("order"."status" = 'delivered' and "order"."delivered_at" is not null and "order"."confirmed_at" is not null) or ("order"."status" <> 'delivered' and "order"."delivered_at" is null))
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"singleton_key" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"currency" text DEFAULT 'COP' NOT NULL,
	"timezone" text DEFAULT 'America/Bogota' NOT NULL,
	"bootstrap_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_singleton_key_unique" UNIQUE("singleton_key"),
	CONSTRAINT "organization_singleton_ck" CHECK ("organization"."singleton_key" = 1),
	CONSTRAINT "organization_currency_ck" CHECK ("organization"."currency" = 'COP'),
	CONSTRAINT "organization_timezone_ck" CHECK ("organization"."timezone" = 'America/Bogota')
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"order_id" uuid NOT NULL,
	"payment_date" date NOT NULL,
	"amount" numeric(18, 0) NOT NULL,
	"method" text,
	"reference" text,
	"notes" text,
	"actor_id" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"voided_at" timestamp with time zone,
	"void_reason" text,
	"correction_of_id" uuid,
	CONSTRAINT "payment_org_id_uq" UNIQUE("org_id","id"),
	CONSTRAINT "payment_org_order_id_uq" UNIQUE("org_id","order_id","id"),
	CONSTRAINT "payment_org_key_uq" UNIQUE("org_id","idempotency_key"),
	CONSTRAINT "payment_positive_ck" CHECK ("payment"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "production_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"order_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"actual_seconds" bigint,
	"failure_reason" text,
	"notes" text,
	CONSTRAINT "attempt_org_order_id_uq" UNIQUE("org_id","order_id","id"),
	CONSTRAINT "attempt_number_uq" UNIQUE("order_id","attempt_number"),
	CONSTRAINT "attempt_status_ck" CHECK ("production_attempt"."status" in ('planned','printing','success','failed')),
	CONSTRAINT "attempt_values_ck" CHECK ("production_attempt"."attempt_number" > 0 and ("production_attempt"."actual_seconds" is null or "production_attempt"."actual_seconds" >= 0))
);
--> statement-breakpoint
CREATE TABLE "quote_material" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"revision_id" uuid NOT NULL,
	"filament_id" uuid NOT NULL,
	"filament_snapshot" jsonb NOT NULL,
	"grams" numeric(18, 6) NOT NULL,
	"price_per_gram" numeric(18, 6) NOT NULL,
	"cost" numeric(18, 6) NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "quote_material_values_ck" CHECK ("quote_material"."grams" > 0 and "quote_material"."price_per_gram" >= 0 and "quote_material"."cost" >= 0 and "quote_material"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "quote_postprocess" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"revision_id" uuid NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"estimated_amount" numeric(18, 6) NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "postprocess_values_ck" CHECK ("quote_postprocess"."estimated_amount" >= 0 and "quote_postprocess"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "quote_price_option" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"revision_id" uuid NOT NULL,
	"level" text NOT NULL,
	"label" text NOT NULL,
	"multiplier" numeric(12, 6) NOT NULL,
	"price" numeric(18, 0) NOT NULL,
	"profit_value" numeric(18, 6) NOT NULL,
	"margin_percent" numeric(18, 6),
	CONSTRAINT "price_option_org_revision_id_uq" UNIQUE("org_id","revision_id","id"),
	CONSTRAINT "price_option_level_uq" UNIQUE("revision_id","level"),
	CONSTRAINT "price_option_level_ck" CHECK ("quote_price_option"."level" in ('minimum','medium','high')),
	CONSTRAINT "price_option_values_ck" CHECK ("quote_price_option"."multiplier" > 0 and "quote_price_option"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "quote_revision" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"quote_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"project_name" text NOT NULL,
	"description" text NOT NULL,
	"client_snapshot" jsonb,
	"print_seconds" bigint NOT NULL,
	"formula_snapshot" jsonb NOT NULL,
	"material_cost" numeric(18, 6) NOT NULL,
	"energy_cost" numeric(18, 6) NOT NULL,
	"machine_cost" numeric(18, 6) NOT NULL,
	"contingency_cost" numeric(18, 6) NOT NULL,
	"postprocess_cost" numeric(18, 6) NOT NULL,
	"estimated_cost" numeric(18, 6) NOT NULL,
	"selected_option_id" uuid,
	"quoted_price" numeric(18, 0),
	"business_date" date NOT NULL,
	"valid_until" date,
	"customer_notes" text,
	"internal_notes" text,
	"sent_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	CONSTRAINT "revision_org_id_uq" UNIQUE("org_id","id"),
	CONSTRAINT "revision_org_quote_id_uq" UNIQUE("org_id","quote_id","id"),
	CONSTRAINT "revision_number_uq" UNIQUE("quote_id","revision_number"),
	CONSTRAINT "revision_status_ck" CHECK ("quote_revision"."status" in ('draft','sent','accepted','rejected','superseded')),
	CONSTRAINT "revision_values_ck" CHECK ("quote_revision"."print_seconds" >= 0 and "quote_revision"."revision_number" > 0 and "quote_revision"."material_cost" >= 0 and "quote_revision"."energy_cost" >= 0 and "quote_revision"."machine_cost" >= 0 and "quote_revision"."contingency_cost" >= 0 and "quote_revision"."postprocess_cost" >= 0 and "quote_revision"."estimated_cost" >= 0 and ("quote_revision"."quoted_price" is null or "quote_revision"."quoted_price" >= 0))
);
--> statement-breakpoint
CREATE TABLE "quote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"sequence_number" bigint NOT NULL,
	"code" text NOT NULL,
	"customer_id" uuid,
	"current_revision_id" uuid,
	"duplicated_from_id" uuid,
	"archived_at" timestamp with time zone,
	CONSTRAINT "quote_org_id_uq" UNIQUE("org_id","id"),
	CONSTRAINT "quote_org_code_uq" UNIQUE("org_id","code"),
	CONSTRAINT "quote_org_number_uq" UNIQUE("org_id","sequence_number")
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" text DEFAULT 'user',
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_correction_of_id_cash_movement_id_fk" FOREIGN KEY ("correction_of_id") REFERENCES "public"."cash_movement"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_org_id_payment_id_payment_org_id_id_fk" FOREIGN KEY ("org_id","payment_id") REFERENCES "public"."payment"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_org_id_expense_id_expense_org_id_id_fk" FOREIGN KEY ("org_id","expense_id") REFERENCES "public"."expense"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_org_id_direct_cost_id_direct_cost_org_id_id_fk" FOREIGN KEY ("org_id","direct_cost_id") REFERENCES "public"."direct_cost"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_org_id_independent_loss_id_independent_loss_org_id_id_fk" FOREIGN KEY ("org_id","independent_loss_id") REFERENCES "public"."independent_loss"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_org_id_correction_of_id_cash_movement_org_id_id_fk" FOREIGN KEY ("org_id","correction_of_id") REFERENCES "public"."cash_movement"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_cost" ADD CONSTRAINT "direct_cost_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_cost" ADD CONSTRAINT "direct_cost_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_cost" ADD CONSTRAINT "direct_cost_correction_of_id_direct_cost_id_fk" FOREIGN KEY ("correction_of_id") REFERENCES "public"."direct_cost"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_cost" ADD CONSTRAINT "direct_cost_org_id_order_id_order_org_id_id_fk" FOREIGN KEY ("org_id","order_id") REFERENCES "public"."order"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_cost" ADD CONSTRAINT "direct_cost_org_id_order_id_attempt_id_production_attempt_org_id_order_id_id_fk" FOREIGN KEY ("org_id","order_id","attempt_id") REFERENCES "public"."production_attempt"("org_id","order_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_cost" ADD CONSTRAINT "direct_cost_org_id_filament_id_filament_org_id_id_fk" FOREIGN KEY ("org_id","filament_id") REFERENCES "public"."filament"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "direct_cost" ADD CONSTRAINT "cost_correction_order_fk" FOREIGN KEY ("org_id","order_id","correction_of_id") REFERENCES "public"."direct_cost"("org_id","order_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_counter" ADD CONSTRAINT "document_counter_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_correction_of_id_expense_id_fk" FOREIGN KEY ("correction_of_id") REFERENCES "public"."expense"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_org_id_responsible_user_id_membership_organization_id_user_id_fk" FOREIGN KEY ("org_id","responsible_user_id") REFERENCES "public"."membership"("organization_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_org_id_correction_of_id_expense_org_id_id_fk" FOREIGN KEY ("org_id","correction_of_id") REFERENCES "public"."expense"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filament" ADD CONSTRAINT "filament_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filament" ADD CONSTRAINT "filament_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "independent_loss" ADD CONSTRAINT "independent_loss_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "independent_loss" ADD CONSTRAINT "independent_loss_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "independent_loss" ADD CONSTRAINT "independent_loss_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "independent_loss" ADD CONSTRAINT "independent_loss_correction_of_id_independent_loss_id_fk" FOREIGN KEY ("correction_of_id") REFERENCES "public"."independent_loss"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "independent_loss" ADD CONSTRAINT "independent_loss_org_id_correction_of_id_independent_loss_org_id_id_fk" FOREIGN KEY ("org_id","correction_of_id") REFERENCES "public"."independent_loss"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutation_request" ADD CONSTRAINT "mutation_request_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mutation_request" ADD CONSTRAINT "mutation_request_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_event" ADD CONSTRAINT "order_status_event_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_event" ADD CONSTRAINT "order_status_event_org_id_order_id_order_org_id_id_fk" FOREIGN KEY ("org_id","order_id") REFERENCES "public"."order"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_org_id_customer_id_customer_org_id_id_fk" FOREIGN KEY ("org_id","customer_id") REFERENCES "public"."customer"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_org_id_source_quote_id_quote_org_id_id_fk" FOREIGN KEY ("org_id","source_quote_id") REFERENCES "public"."quote"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_accepted_source_fk" FOREIGN KEY ("org_id","source_quote_id","accepted_revision_id") REFERENCES "public"."quote_revision"("org_id","quote_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_correction_of_id_payment_id_fk" FOREIGN KEY ("correction_of_id") REFERENCES "public"."payment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_org_id_order_id_order_org_id_id_fk" FOREIGN KEY ("org_id","order_id") REFERENCES "public"."order"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_correction_order_fk" FOREIGN KEY ("org_id","order_id","correction_of_id") REFERENCES "public"."payment"("org_id","order_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_attempt" ADD CONSTRAINT "production_attempt_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_attempt" ADD CONSTRAINT "production_attempt_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_attempt" ADD CONSTRAINT "production_attempt_org_id_order_id_order_org_id_id_fk" FOREIGN KEY ("org_id","order_id") REFERENCES "public"."order"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_material" ADD CONSTRAINT "quote_material_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_material" ADD CONSTRAINT "quote_material_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_material" ADD CONSTRAINT "quote_material_org_id_revision_id_quote_revision_org_id_id_fk" FOREIGN KEY ("org_id","revision_id") REFERENCES "public"."quote_revision"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_material" ADD CONSTRAINT "quote_material_org_id_filament_id_filament_org_id_id_fk" FOREIGN KEY ("org_id","filament_id") REFERENCES "public"."filament"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_postprocess" ADD CONSTRAINT "quote_postprocess_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_postprocess" ADD CONSTRAINT "quote_postprocess_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_postprocess" ADD CONSTRAINT "quote_postprocess_org_id_revision_id_quote_revision_org_id_id_fk" FOREIGN KEY ("org_id","revision_id") REFERENCES "public"."quote_revision"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_price_option" ADD CONSTRAINT "quote_price_option_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_price_option" ADD CONSTRAINT "quote_price_option_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_price_option" ADD CONSTRAINT "quote_price_option_org_id_revision_id_quote_revision_org_id_id_fk" FOREIGN KEY ("org_id","revision_id") REFERENCES "public"."quote_revision"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_revision" ADD CONSTRAINT "quote_revision_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_revision" ADD CONSTRAINT "quote_revision_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_revision" ADD CONSTRAINT "revision_quote_fk" FOREIGN KEY ("org_id","quote_id") REFERENCES "public"."quote"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_revision" ADD CONSTRAINT "revision_selected_option_fk" FOREIGN KEY ("org_id","id","selected_option_id") REFERENCES "public"."quote_price_option"("org_id","revision_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_duplicated_from_id_quote_id_fk" FOREIGN KEY ("duplicated_from_id") REFERENCES "public"."quote"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_customer_fk" FOREIGN KEY ("org_id","customer_id") REFERENCES "public"."customer"("org_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote" ADD CONSTRAINT "quote_current_revision_fk" FOREIGN KEY ("org_id","id","current_revision_id") REFERENCES "public"."quote_revision"("org_id","quote_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_event" USING btree ("org_id","entity_type","entity_id","occurred_at");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_event" USING btree ("actor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cash_payment_active_uq" ON "cash_movement" USING btree ("payment_id") WHERE "cash_movement"."voided_at" is null and "cash_movement"."payment_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "cash_expense_active_uq" ON "cash_movement" USING btree ("expense_id") WHERE "cash_movement"."voided_at" is null and "cash_movement"."expense_id" is not null;--> statement-breakpoint
CREATE INDEX "cash_date_idx" ON "cash_movement" USING btree ("org_id","business_date","direction");--> statement-breakpoint
CREATE INDEX "cash_direct_cost_idx" ON "cash_movement" USING btree ("org_id","direct_cost_id");--> statement-breakpoint
CREATE INDEX "cash_loss_idx" ON "cash_movement" USING btree ("org_id","independent_loss_id");--> statement-breakpoint
CREATE INDEX "customer_org_name_idx" ON "customer" USING btree ("org_id","name");--> statement-breakpoint
CREATE INDEX "direct_cost_order_date_idx" ON "direct_cost" USING btree ("org_id","order_id","incurred_date");--> statement-breakpoint
CREATE INDEX "direct_cost_attempt_idx" ON "direct_cost" USING btree ("org_id","attempt_id");--> statement-breakpoint
CREATE INDEX "direct_cost_filament_idx" ON "direct_cost" USING btree ("org_id","filament_id");--> statement-breakpoint
CREATE INDEX "expense_date_idx" ON "expense" USING btree ("org_id","expense_date","classification");--> statement-breakpoint
CREATE INDEX "filament_org_brand_idx" ON "filament" USING btree ("org_id","brand");--> statement-breakpoint
CREATE INDEX "loss_date_idx" ON "independent_loss" USING btree ("org_id","recognized_date");--> statement-breakpoint
CREATE INDEX "membership_user_idx" ON "membership" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "status_event_order_idx" ON "order_status_event" USING btree ("org_id","order_id","occurred_at");--> statement-breakpoint
CREATE INDEX "order_status_date_idx" ON "order" USING btree ("org_id","status","order_date");--> statement-breakpoint
CREATE INDEX "order_customer_idx" ON "order" USING btree ("org_id","customer_id","confirmed_at");--> statement-breakpoint
CREATE INDEX "order_delivered_idx" ON "order" USING btree ("org_id","delivered_at");--> statement-breakpoint
CREATE INDEX "order_confirmed_idx" ON "order" USING btree ("org_id","confirmed_at");--> statement-breakpoint
CREATE INDEX "payment_order_date_idx" ON "payment" USING btree ("org_id","order_id","payment_date");--> statement-breakpoint
CREATE INDEX "payment_date_idx" ON "payment" USING btree ("org_id","payment_date");--> statement-breakpoint
CREATE INDEX "quote_material_revision_idx" ON "quote_material" USING btree ("org_id","revision_id");--> statement-breakpoint
CREATE INDEX "quote_material_filament_idx" ON "quote_material" USING btree ("org_id","filament_id");--> statement-breakpoint
CREATE INDEX "quote_postprocess_revision_idx" ON "quote_postprocess" USING btree ("org_id","revision_id");--> statement-breakpoint
CREATE INDEX "revision_status_date_idx" ON "quote_revision" USING btree ("org_id","status","business_date");--> statement-breakpoint
CREATE INDEX "quote_customer_idx" ON "quote" USING btree ("org_id","customer_id","created_at");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");