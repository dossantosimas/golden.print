import { sql } from "drizzle-orm";
import {
  pgTable, text, uuid, timestamp, boolean, integer, bigint, numeric, date,
  jsonb, index, unique, uniqueIndex, check, foreignKey, primaryKey,
  type AnyPgColumn, type PgTableExtraConfigValue,
} from "drizzle-orm/pg-core";

const instant = (name: string) => timestamp(name, { withTimezone: true });
const money = (name: string) => numeric(name, { precision: 18, scale: 0 });
const decimal = (name: string) => numeric(name, { precision: 18, scale: 6 });
const factor = (name: string) => numeric(name, { precision: 12, scale: 6 });
const business = () => ({
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "restrict" }),
  createdAt: instant("created_at").defaultNow().notNull(),
  updatedAt: instant("updated_at").defaultNow().notNull(),
  createdBy: text("created_by").notNull().references(() => user.id, { onDelete: "restrict" }),
  version: integer("version").default(1).notNull(),
});
const voidFields = () => ({ voidedAt: instant("voided_at"), voidReason: text("void_reason") });

// Better Auth core schema and admin plugin fields: IDs remain strings.
export const user = pgTable("user", {
  id: text("id").primaryKey(), name: text("name").notNull(),
  email: text("email").notNull().unique(), emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"), createdAt: instant("created_at").defaultNow().notNull(),
  updatedAt: instant("updated_at").defaultNow().notNull(), role: text("role").default("user"),
  banned: boolean("banned").default(false), banReason: text("ban_reason"), banExpires: instant("ban_expires"),
});
export const session = pgTable("session", {
  id: text("id").primaryKey(), expiresAt: instant("expires_at").notNull(), token: text("token").notNull().unique(),
  createdAt: instant("created_at").defaultNow().notNull(), updatedAt: instant("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"), userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
}, (t) => [index("session_user_idx").on(t.userId)]);
export const account = pgTable("account", {
  id: text("id").primaryKey(), accountId: text("account_id").notNull(), providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"), refreshToken: text("refresh_token"), idToken: text("id_token"),
  accessTokenExpiresAt: instant("access_token_expires_at"), refreshTokenExpiresAt: instant("refresh_token_expires_at"),
  scope: text("scope"), password: text("password"), createdAt: instant("created_at").defaultNow().notNull(),
  updatedAt: instant("updated_at").defaultNow().notNull(),
}, (t) => [index("account_user_idx").on(t.userId), unique("account_provider_identity_uq").on(t.providerId, t.accountId)]);
export const verification = pgTable("verification", {
  id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(),
  expiresAt: instant("expires_at").notNull(), createdAt: instant("created_at").defaultNow().notNull(),
  updatedAt: instant("updated_at").defaultNow().notNull(),
}, (t) => [index("verification_identifier_idx").on(t.identifier)]);
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(), key: text("key").notNull().unique(), count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

export const organizations = pgTable("organization", {
  id: uuid("id").defaultRandom().primaryKey(), singletonKey: integer("singleton_key").default(1).notNull().unique(),
  name: text("name").notNull(), currency: text("currency").default("COP").notNull(),
  timezone: text("timezone").default("America/Bogota").notNull(), bootstrapCompletedAt: instant("bootstrap_completed_at"),
  createdAt: instant("created_at").defaultNow().notNull(),
}, (t) => [check("organization_singleton_ck", sql`${t.singletonKey} = 1`),
  check("organization_currency_ck", sql`${t.currency} = 'COP'`), check("organization_timezone_ck", sql`${t.timezone} = 'America/Bogota'`)]);
export const memberships = pgTable("membership", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "restrict" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
  role: text("role").notNull(), active: boolean("active").default(true).notNull(),
  createdAt: instant("created_at").defaultNow().notNull(), updatedAt: instant("updated_at").defaultNow().notNull(),
  version: integer("version").default(1).notNull(),
}, (t) => [unique("membership_org_user_uq").on(t.organizationId, t.userId), index("membership_user_idx").on(t.userId),
  check("membership_role_ck", sql`${t.role} in ('administrator','operator')`)]);
export const businessSettings = pgTable("business_settings", {
  organizationId: uuid("organization_id").primaryKey().references(() => organizations.id, { onDelete: "restrict" }),
  formulaVersion: integer("formula_version").default(1).notNull(), machineHourRate: decimal("machine_hour_rate").default("2000").notNull(),
  powerKw: factor("power_kw").default("0.15").notNull(), energyKwhRate: decimal("energy_kwh_rate").default("1100").notNull(),
  contingencyRate: factor("contingency_rate").default("0.10").notNull(),
  minimumMultiplier: factor("minimum_multiplier").default("2").notNull(), mediumMultiplier: factor("medium_multiplier").default("2.5").notNull(),
  highMultiplier: factor("high_multiplier").default("3").notNull(), updatedBy: text("updated_by").notNull().references(() => user.id),
  updatedAt: instant("updated_at").defaultNow().notNull(), version: integer("version").default(1).notNull(),
}, (t) => [check("settings_rates_ck", sql`${t.machineHourRate} >= 0 and ${t.powerKw} >= 0 and ${t.energyKwhRate} >= 0 and ${t.contingencyRate} between 0 and 1`),
  check("settings_multipliers_ck", sql`${t.minimumMultiplier} > 0 and ${t.mediumMultiplier} >= ${t.minimumMultiplier} and ${t.highMultiplier} >= ${t.mediumMultiplier}`)]);
export const documentCounters = pgTable("document_counter", {
  organizationId: uuid("organization_id").notNull().references(() => organizations.id), kind: text("kind").notNull(),
  nextValue: bigint("next_value", { mode: "bigint" }).default(sql`1`).notNull(),
}, (t) => [primaryKey({ columns: [t.organizationId, t.kind] }), check("counter_kind_ck", sql`${t.kind} in ('COT','PED')`), check("counter_positive_ck", sql`${t.nextValue} > 0`)]);

export const customers = pgTable("customer", {
  ...business(), name: text("name").notNull(), contactPhone: text("contact_phone").notNull().default(""), email: text("email"),
  socialHandle: text("social_handle"), address: text("address"), notes: text("notes"), archivedAt: instant("archived_at"),
}, (t) => [unique("customer_org_id_uq").on(t.orgId, t.id), index("customer_org_name_idx").on(t.orgId, t.name),
  check("customer_required_ck", sql`length(trim(${t.name})) > 0`)]);
export const filaments = pgTable("filament", {
  ...business(), brand: text("brand").notNull(), model: text("model").notNull(), materialType: text("material_type").notNull(),
  color: text("color").notNull(), purchaseValue: decimal("purchase_value").notNull(), rollWeightG: decimal("roll_weight_g").notNull(),
  archivedAt: instant("archived_at"),
}, (t) => [unique("filament_org_id_uq").on(t.orgId, t.id), index("filament_org_brand_idx").on(t.orgId, t.brand),
  check("filament_values_ck", sql`${t.purchaseValue} >= 0 and ${t.rollWeightG} > 0`)]);

export const quotes = pgTable("quote", {
  ...business(), sequenceNumber: bigint("sequence_number", { mode: "bigint" }).notNull(), code: text("code").notNull(),
  customerId: uuid("customer_id"), currentRevisionId: uuid("current_revision_id"),
  duplicatedFromId: uuid("duplicated_from_id").references((): AnyPgColumn => quotes.id), archivedAt: instant("archived_at"),
}, (t): PgTableExtraConfigValue[] => [unique("quote_org_id_uq").on(t.orgId, t.id), unique("quote_org_code_uq").on(t.orgId, t.code),
  unique("quote_org_number_uq").on(t.orgId, t.sequenceNumber), index("quote_customer_idx").on(t.orgId, t.customerId, t.createdAt),
  foreignKey({ name: "quote_customer_fk", columns: [t.orgId, t.customerId], foreignColumns: [customers.orgId, customers.id] }).onDelete("restrict"),
  foreignKey({ name: "quote_current_revision_fk", columns: [t.orgId, t.id, t.currentRevisionId], foreignColumns: [quoteRevisions.orgId, quoteRevisions.quoteId, quoteRevisions.id] }).onDelete("restrict")]);
export const quoteRevisions = pgTable("quote_revision", {
  images: jsonb("images").$type<{id:string;title:string}[]>().default([]).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  ...business(), quoteId: uuid("quote_id").notNull(), revisionNumber: integer("revision_number").notNull(),
  status: text("status").default("draft").notNull(), projectName: text("project_name").notNull(), description: text("description").notNull(),
  clientSnapshot: jsonb("client_snapshot"), printSeconds: bigint("print_seconds", { mode: "bigint" }).notNull(),
  formulaSnapshot: jsonb("formula_snapshot").notNull(), materialCost: decimal("material_cost").notNull(), energyCost: decimal("energy_cost").notNull(),
  machineCost: decimal("machine_cost").notNull(), contingencyCost: decimal("contingency_cost").notNull(), postprocessCost: decimal("postprocess_cost").notNull(),
  estimatedCost: decimal("estimated_cost").notNull(), selectedOptionId: uuid("selected_option_id"), quotedPrice: money("quoted_price"),
  businessDate: date("business_date").notNull(), validUntil: date("valid_until"), customerNotes: text("customer_notes"), internalNotes: text("internal_notes"),
  sentAt: instant("sent_at"), acceptedAt: instant("accepted_at"), rejectedAt: instant("rejected_at"),
}, (t): PgTableExtraConfigValue[] => [unique("revision_org_id_uq").on(t.orgId, t.id), unique("revision_org_quote_id_uq").on(t.orgId, t.quoteId, t.id),
  unique("revision_number_uq").on(t.quoteId, t.revisionNumber), index("revision_status_date_idx").on(t.orgId, t.status, t.businessDate),
  foreignKey({ name: "revision_quote_fk", columns: [t.orgId, t.quoteId], foreignColumns: [quotes.orgId, quotes.id] }).onDelete("restrict"),
  foreignKey({ name: "revision_selected_option_fk", columns: [t.orgId, t.id, t.selectedOptionId], foreignColumns: [quotePriceOptions.orgId, quotePriceOptions.revisionId, quotePriceOptions.id] }).onDelete("restrict"),
  check("revision_status_ck", sql`${t.status} in ('draft','sent','accepted','rejected','superseded')`),
  check("revision_quantity_ck", sql`${t.quantity} between 1 and 10000`),
  check("revision_values_ck", sql`${t.printSeconds} >= 0 and ${t.revisionNumber} > 0 and ${t.materialCost} >= 0 and ${t.energyCost} >= 0 and ${t.machineCost} >= 0 and ${t.contingencyCost} >= 0 and ${t.postprocessCost} >= 0 and ${t.estimatedCost} >= 0 and (${t.quotedPrice} is null or ${t.quotedPrice} >= 0)`)]);
export const quoteMaterials = pgTable("quote_material", {
  ...business(), revisionId: uuid("revision_id").notNull(), filamentId: uuid("filament_id").notNull(), filamentSnapshot: jsonb("filament_snapshot").notNull(),
  grams: decimal("grams").notNull(), pricePerGram: decimal("price_per_gram").notNull(), cost: decimal("cost").notNull(), position: integer("position").notNull(),
}, (t) => [index("quote_material_revision_idx").on(t.orgId, t.revisionId), index("quote_material_filament_idx").on(t.orgId, t.filamentId),
  foreignKey({ columns: [t.orgId, t.revisionId], foreignColumns: [quoteRevisions.orgId, quoteRevisions.id] }).onDelete("restrict"),
  foreignKey({ columns: [t.orgId, t.filamentId], foreignColumns: [filaments.orgId, filaments.id] }).onDelete("restrict"),
  check("quote_material_values_ck", sql`${t.grams} > 0 and ${t.pricePerGram} >= 0 and ${t.cost} >= 0 and ${t.position} >= 0`)]);
export const quotePostprocesses = pgTable("quote_postprocess", {
  ...business(), revisionId: uuid("revision_id").notNull(), description: text("description").notNull(), category: text("category").notNull(),
  estimatedAmount: decimal("estimated_amount").notNull(), position: integer("position").notNull(),
}, (t) => [index("quote_postprocess_revision_idx").on(t.orgId, t.revisionId),
  foreignKey({ columns: [t.orgId, t.revisionId], foreignColumns: [quoteRevisions.orgId, quoteRevisions.id] }).onDelete("restrict"),
  check("postprocess_values_ck", sql`${t.estimatedAmount} >= 0 and ${t.position} >= 0`)]);
export const quotePriceOptions = pgTable("quote_price_option", {
  ...business(), revisionId: uuid("revision_id").notNull(), level: text("level").notNull(), label: text("label").notNull(),
  multiplier: factor("multiplier").notNull(), price: money("price").notNull(), profitValue: decimal("profit_value").notNull(), marginPercent: decimal("margin_percent"),
}, (t): PgTableExtraConfigValue[] => [unique("price_option_org_revision_id_uq").on(t.orgId, t.revisionId, t.id), unique("price_option_level_uq").on(t.revisionId, t.level),
  foreignKey({ columns: [t.orgId, t.revisionId], foreignColumns: [quoteRevisions.orgId, quoteRevisions.id] }).onDelete("restrict"),
  check("price_option_level_ck", sql`${t.level} in ('minimum','medium','high')`), check("price_option_values_ck", sql`${t.multiplier} > 0 and ${t.price} >= 0`)]);

export const orders = pgTable("order", {
  ...business(), sequenceNumber: bigint("sequence_number", { mode: "bigint" }).notNull(), code: text("code").notNull(), customerId: uuid("customer_id").notNull(),
  sourceQuoteId: uuid("source_quote_id"), acceptedRevisionId: uuid("accepted_revision_id"), title: text("title").notNull(), status: text("status").default("not_started").notNull(),
  orderDate: date("order_date").notNull(), promisedDeliveryDate: date("promised_delivery_date"), confirmedAt: instant("confirmed_at"), deliveredAt: instant("delivered_at"),
  closedAt: instant("closed_at"),
  agreedPrice: money("agreed_price"), estimatedCostOverride: decimal("estimated_cost_override"), costCompleteness: text("cost_completeness").default("incomplete").notNull(), notes: text("notes"), archivedAt: instant("archived_at"),
}, (t) => [unique("order_org_id_uq").on(t.orgId, t.id), unique("order_org_code_uq").on(t.orgId, t.code), unique("order_org_number_uq").on(t.orgId, t.sequenceNumber),
  index("order_source_quote_customer_idx").on(t.orgId, t.sourceQuoteId, t.customerId), index("order_accepted_revision_idx").on(t.acceptedRevisionId),
  index("order_status_date_idx").on(t.orgId, t.status, t.orderDate), index("order_customer_idx").on(t.orgId, t.customerId, t.confirmedAt),
  index("order_delivered_idx").on(t.orgId, t.deliveredAt), index("order_confirmed_idx").on(t.orgId, t.confirmedAt),
  foreignKey({ columns: [t.orgId, t.customerId], foreignColumns: [customers.orgId, customers.id] }).onDelete("restrict"),
  foreignKey({ columns: [t.orgId, t.sourceQuoteId], foreignColumns: [quotes.orgId, quotes.id] }).onDelete("restrict"),
  foreignKey({ name: "order_accepted_source_fk", columns: [t.orgId, t.sourceQuoteId, t.acceptedRevisionId], foreignColumns: [quoteRevisions.orgId, quoteRevisions.quoteId, quoteRevisions.id] }).onDelete("restrict"),
  check("order_status_ck", sql`${t.status} in ('not_started','printing','finished','delivered','closed','damaged')`),
  check("order_closed_ck", sql`(${t.status} = 'closed' and ${t.closedAt} is not null and ${t.deliveredAt} is not null) or (${t.status} <> 'closed' and ${t.closedAt} is null)`),
  check("order_completeness_ck", sql`${t.costCompleteness} in ('incomplete','complete')`),
  check("order_estimate_ck", sql`${t.estimatedCostOverride} is null or ${t.estimatedCostOverride} >= 0`),
  check("order_confirmation_ck", sql`(${t.confirmedAt} is null and ${t.sourceQuoteId} is null and ${t.acceptedRevisionId} is null and ${t.agreedPrice} is null) or (${t.confirmedAt} is not null and ${t.sourceQuoteId} is not null and ${t.acceptedRevisionId} is not null and ${t.agreedPrice} is not null and ${t.agreedPrice} >= 0)`),
  check("order_delivered_ck", sql`(${t.status} in ('delivered','closed') and ${t.deliveredAt} is not null and ${t.confirmedAt} is not null) or (${t.status} not in ('delivered','closed') and ${t.deliveredAt} is null)`)]);
export const productionAttempts = pgTable("production_attempt", {
  ...business(), orderId: uuid("order_id").notNull(), attemptNumber: integer("attempt_number").notNull(), status: text("status").default("planned").notNull(),
  startedAt: instant("started_at"), completedAt: instant("completed_at"), actualSeconds: bigint("actual_seconds", { mode: "bigint" }), failureReason: text("failure_reason"), notes: text("notes"),
}, (t) => [unique("attempt_org_order_id_uq").on(t.orgId, t.orderId, t.id), unique("attempt_number_uq").on(t.orderId, t.attemptNumber),
  foreignKey({ columns: [t.orgId, t.orderId], foreignColumns: [orders.orgId, orders.id] }).onDelete("restrict"),
  check("attempt_status_ck", sql`${t.status} in ('planned','printing','success','failed')`), check("attempt_values_ck", sql`${t.attemptNumber} > 0 and (${t.actualSeconds} is null or ${t.actualSeconds} >= 0)`)]);
export const directCosts = pgTable("direct_cost", {
  ...business(), orderId: uuid("order_id").notNull(), attemptId: uuid("attempt_id"), category: text("category").notNull(),
  economicClassification: text("economic_classification").notNull(), cashNature: text("cash_nature").notNull(), description: text("description").notNull(),
  incurredDate: date("incurred_date").notNull(), quantity: decimal("quantity"), unitCost: decimal("unit_cost"), amount: decimal("amount").notNull(),
  filamentId: uuid("filament_id"), priceSnapshot: jsonb("price_snapshot"), ...voidFields(), correctionOfId: uuid("correction_of_id").references((): AnyPgColumn => directCosts.id),
}, (t): PgTableExtraConfigValue[] => [unique("direct_cost_org_id_uq").on(t.orgId, t.id), unique("direct_cost_org_order_id_uq").on(t.orgId, t.orderId, t.id),
  index("direct_cost_order_date_idx").on(t.orgId, t.orderId, t.incurredDate), index("direct_cost_attempt_idx").on(t.orgId, t.attemptId), index("direct_cost_filament_idx").on(t.orgId, t.filamentId),
  foreignKey({ columns: [t.orgId, t.orderId], foreignColumns: [orders.orgId, orders.id] }).onDelete("restrict"),
  foreignKey({ columns: [t.orgId, t.orderId, t.attemptId], foreignColumns: [productionAttempts.orgId, productionAttempts.orderId, productionAttempts.id] }).onDelete("restrict"),
  foreignKey({ columns: [t.orgId, t.filamentId], foreignColumns: [filaments.orgId, filaments.id] }).onDelete("restrict"),
  foreignKey({ name: "cost_correction_order_fk", columns: [t.orgId, t.orderId, t.correctionOfId], foreignColumns: [t.orgId, t.orderId, t.id] }).onDelete("restrict"),
  check("direct_cost_values_ck", sql`${t.amount} > 0 and (${t.quantity} is null or ${t.quantity} >= 0) and (${t.unitCost} is null or ${t.unitCost} >= 0)`),
  check("direct_cost_category_ck", sql`${t.category} in ('material','energy','machine','postprocess','other')`),
  check("direct_cost_classification_ck", sql`${t.economicClassification} in ('variable','nonvariable') and ${t.cashNature} in ('monetary','nonmonetary')`)]);
export const orderStatusEvents = pgTable("order_status_event", {
  id: uuid("id").defaultRandom().primaryKey(), orgId: uuid("org_id").notNull(), orderId: uuid("order_id").notNull(), fromStatus: text("from_status"), toStatus: text("to_status").notNull(),
  occurredAt: instant("occurred_at").defaultNow().notNull(), actorId: text("actor_id").notNull().references(() => user.id), reason: text("reason"),
}, (t) => [index("status_event_order_idx").on(t.orgId, t.orderId, t.occurredAt), foreignKey({ columns: [t.orgId, t.orderId], foreignColumns: [orders.orgId, orders.id] }).onDelete("restrict")]);

export const payments = pgTable("payment", {
  ...business(), orderId: uuid("order_id").notNull(), paymentDate: date("payment_date").notNull(), amount: money("amount").notNull(),
  method: text("method"), reference: text("reference"), notes: text("notes"), actorId: text("actor_id").notNull().references(() => user.id),
  idempotencyKey: text("idempotency_key").notNull(), ...voidFields(), correctionOfId: uuid("correction_of_id").references((): AnyPgColumn => payments.id),
}, (t): PgTableExtraConfigValue[] => [unique("payment_org_id_uq").on(t.orgId, t.id), unique("payment_org_order_id_uq").on(t.orgId, t.orderId, t.id),
  unique("payment_org_key_uq").on(t.orgId, t.idempotencyKey), index("payment_order_date_idx").on(t.orgId, t.orderId, t.paymentDate), index("payment_date_idx").on(t.orgId, t.paymentDate),
  foreignKey({ columns: [t.orgId, t.orderId], foreignColumns: [orders.orgId, orders.id] }).onDelete("restrict"),
  foreignKey({ name: "payment_correction_order_fk", columns: [t.orgId, t.orderId, t.correctionOfId], foreignColumns: [t.orgId, t.orderId, t.id] }).onDelete("restrict"), check("payment_positive_ck", sql`${t.amount} > 0`)]);
export const expenses = pgTable("expense", {
  ...business(), expenseDate: date("expense_date").notNull(), description: text("description").notNull(), classification: text("classification").notNull(),
  costBehavior: text("cost_behavior"), category: text("category").notNull(), amount: money("amount").notNull(),
  responsibleUserId: text("responsible_user_id").notNull(), notes: text("notes"), ...voidFields(),
  correctionOfId: uuid("correction_of_id").references((): AnyPgColumn => expenses.id),
}, (t): PgTableExtraConfigValue[] => [unique("expense_org_id_uq").on(t.orgId, t.id), index("expense_date_idx").on(t.orgId, t.expenseDate, t.classification),
  foreignKey({ columns: [t.orgId, t.responsibleUserId], foreignColumns: [memberships.organizationId, memberships.userId] }).onDelete("restrict"),
  foreignKey({ columns: [t.orgId, t.correctionOfId], foreignColumns: [t.orgId, t.id] }).onDelete("restrict"),
  check("expense_positive_ck", sql`${t.amount} > 0`), check("expense_classification_ck", sql`(${t.classification} = 'opex' and ${t.costBehavior} is not null and ${t.costBehavior} in ('fixed','variable')) or (${t.classification} = 'material_purchase' and ${t.costBehavior} is null)`)]);
export const independentLosses = pgTable("independent_loss", {
  ...business(), recognizedDate: date("recognized_date").notNull(), category: text("category").notNull(), description: text("description").notNull(),
  amount: decimal("amount").notNull(), actorId: text("actor_id").notNull().references(() => user.id), originReference: text("origin_reference"), ...voidFields(),
  correctionOfId: uuid("correction_of_id").references((): AnyPgColumn => independentLosses.id),
}, (t): PgTableExtraConfigValue[] => [unique("loss_org_id_uq").on(t.orgId, t.id), index("loss_date_idx").on(t.orgId, t.recognizedDate),
  foreignKey({ columns: [t.orgId, t.correctionOfId], foreignColumns: [t.orgId, t.id] }).onDelete("restrict"), check("loss_positive_ck", sql`${t.amount} > 0`)]);
export const cashMovements = pgTable("cash_movement", {
  ...business(), businessDate: date("business_date").notNull(), direction: text("direction").notNull(), amount: money("amount").notNull(), sourceKind: text("source_kind").notNull(),
  paymentId: uuid("payment_id"), expenseId: uuid("expense_id"), directCostId: uuid("direct_cost_id"), independentLossId: uuid("independent_loss_id"),
  reference: text("reference"), actorId: text("actor_id").notNull().references(() => user.id), ...voidFields(),
  correctionOfId: uuid("correction_of_id").references((): AnyPgColumn => cashMovements.id),
}, (t): PgTableExtraConfigValue[] => [unique("cash_org_id_uq").on(t.orgId, t.id),
  uniqueIndex("cash_payment_active_uq").on(t.paymentId).where(sql`${t.voidedAt} is null and ${t.paymentId} is not null`),
  uniqueIndex("cash_expense_active_uq").on(t.expenseId).where(sql`${t.voidedAt} is null and ${t.expenseId} is not null`),
  index("cash_date_idx").on(t.orgId, t.businessDate, t.direction), index("cash_direct_cost_idx").on(t.orgId, t.directCostId), index("cash_loss_idx").on(t.orgId, t.independentLossId),
  foreignKey({ columns: [t.orgId, t.paymentId], foreignColumns: [payments.orgId, payments.id] }).onDelete("restrict"),
  foreignKey({ columns: [t.orgId, t.expenseId], foreignColumns: [expenses.orgId, expenses.id] }).onDelete("restrict"),
  foreignKey({ columns: [t.orgId, t.directCostId], foreignColumns: [directCosts.orgId, directCosts.id] }).onDelete("restrict"),
  foreignKey({ columns: [t.orgId, t.independentLossId], foreignColumns: [independentLosses.orgId, independentLosses.id] }).onDelete("restrict"),
  foreignKey({ columns: [t.orgId, t.correctionOfId], foreignColumns: [t.orgId, t.id] }).onDelete("restrict"),
  check("cash_positive_ck", sql`${t.amount} > 0`), check("cash_direction_ck", sql`${t.direction} in ('in','out')`),
  check("cash_source_ck", sql`num_nonnulls(${t.paymentId}, ${t.expenseId}, ${t.directCostId}, ${t.independentLossId}) = 1 and ((${t.sourceKind} = 'payment' and ${t.paymentId} is not null and ${t.direction} = 'in') or (${t.sourceKind} = 'expense' and ${t.expenseId} is not null and ${t.direction} = 'out') or (${t.sourceKind} = 'direct_cost' and ${t.directCostId} is not null and ${t.direction} = 'out') or (${t.sourceKind} = 'independent_loss' and ${t.independentLossId} is not null and ${t.direction} = 'out'))`)]);
export const auditEvents = pgTable("audit_event", {
  id: uuid("id").defaultRandom().primaryKey(), orgId: uuid("org_id").notNull().references(() => organizations.id), actorId: text("actor_id").notNull().references(() => user.id),
  entityType: text("entity_type").notNull(), entityId: text("entity_id").notNull(), action: text("action").notNull(),
  occurredAt: instant("occurred_at").defaultNow().notNull(), metadata: jsonb("metadata").notNull(),
}, (t) => [index("audit_entity_idx").on(t.orgId, t.entityType, t.entityId, t.occurredAt), index("audit_actor_idx").on(t.actorId)]);
export const mutationRequests = pgTable("mutation_request", {
  id: uuid("id").defaultRandom().primaryKey(), orgId: uuid("org_id").notNull().references(() => organizations.id), actorId: text("actor_id").notNull().references(() => user.id),
  operation: text("operation").notNull(), idempotencyKey: text("idempotency_key").notNull(), inputHash: text("input_hash").notNull(),
  resultEntityType: text("result_entity_type").notNull(), resultEntityId: uuid("result_entity_id").notNull(), resultStatus: text("result_status").notNull(),
  completedAt: instant("completed_at").defaultNow().notNull(),
}, (t) => [unique("mutation_request_key_uq").on(t.orgId, t.actorId, t.operation, t.idempotencyKey)]);

// Immutable, private JPEG assets. Titles and ordering belong to the revision.
export const quoteImageAssets = pgTable("quote_image_asset", {
  ...business(),
  data: text("data").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
}, (t)=>[
  index("quote_image_org_creator_date_idx").on(t.orgId,t.createdBy,t.createdAt),
  check("quote_image_dimensions_ck",sql`${t.width} between 1 and 1600 and ${t.height} between 1 and 1600`),
  check("quote_image_size_ck",sql`length(${t.data}) between 1 and 409600`),
]);
