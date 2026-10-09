import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import Decimal from "decimal.js";
import { z } from "zod";
import type { DbTransaction } from "./db";
import { orders, productionAttempts, directCosts, payments, expenses, independentLosses,
  cashMovements, auditEvents, orderStatusEvents, memberships, filaments } from "./db/schema";

type Context = { userId: string; organizationId: string; role: "administrator" | "operator" };
type Input = Record<string, unknown>;
export class ProductionError extends Error {
  constructor(public code: string, message: string, public currentVersion?: number) { super(message); this.name = "ProductionError"; }
}
function fail(code: string, message: string): never { throw new ProductionError(code, message); }
const admin = (ctx: Context) => { if (ctx.role !== "administrator") fail("FORBIDDEN", "Esta operación requiere un administrador."); };
const id = z.string().uuid();
const note = z.string().max(5000);
const description = z.string().trim().min(1).max(5000);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => {
  const d = new Date(`${s}T12:00:00Z`); return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === s;
}, "Fecha inválida.");
const decimal = z.string().regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,6})?$/);
const positiveDecimal = decimal.refine((s) => new Decimal(s).gt(0), "Debe ser positivo.");
const integerMoney = z.string().regex(/^(?:0|[1-9]\d{0,17})$/).refine((s) => new Decimal(s).gt(0), "Debe ser positivo.");
const seconds = z.string().regex(/^(?:0|[1-9]\d*)$/).refine((s) => BigInt(s) <= 9223372036854775807n);
const shared = { idempotencyKey: id.optional(), expectedVersion: z.number().int().positive().optional(), orderVersion: z.number().int().positive().optional() };
const parse = <T extends z.ZodRawShape>(shape: T, input: Input) => z.object({ ...shared, ...shape }).strict().parse(input);
const cashOutShape = z.object({ date: day, amount: integerMoney, reference: z.string().max(200).optional() }).strict();
const costShape = {
  orderId: id, attemptId: id.nullish(), category: z.enum(["material", "energy", "machine", "postprocess", "other"]),
  economicClassification: z.enum(["variable", "nonvariable"]), cashNature: z.enum(["monetary", "nonmonetary"]),
  description, incurredDate: day, amount: positiveDecimal, quantity: decimal.nullish(), unitCost: decimal.nullish(),
  filamentId: id.nullish(), cashOut: cashOutShape.optional(),
};
const expenseShape = { expenseDate: day, description, classification: z.enum(["opex", "material_purchase"]),
  costBehavior: z.enum(["fixed", "variable"]).nullish(), category: z.string().min(1).max(200), amount: integerMoney,
  responsibleUserId: z.string().min(1), notes: note.optional() };
const lossShape = { recognizedDate: day, category: z.string().min(1).max(200), description, amount: positiveDecimal,
  originReference: z.string().max(200).optional(), cashOut: cashOutShape.optional() };
const base = (ctx: Context) => ({ orgId: ctx.organizationId, createdBy: ctx.userId });
const changed = (table: { version: AnyPgColumn }) => ({ updatedAt: new Date(), version: sql`${table.version} + 1` });
const version = (current: number, supplied: number | undefined) => {
  if (supplied === undefined) fail("VALIDATION_ERROR", "Se requiere la versión del registro.");
  if (supplied !== current) throw new ProductionError("VERSION_CONFLICT", "El registro cambió. Recarga antes de continuar.", current);
};
const scoped = (table: { orgId: AnyPgColumn; id: AnyPgColumn }, ctx: Context, entityId: string) => and(eq(table.orgId, ctx.organizationId), eq(table.id, entityId));

async function lockOrder(tx: DbTransaction, ctx: Context, orderId: string) {
  const [order] = await tx.select().from(orders).where(scoped(orders, ctx, orderId)).for("update");
  if (!order || order.archivedAt) fail("NOT_FOUND", "Pedido no encontrado.");
  if (order.closedAt) fail("ORDER_CLOSED", "El pedido está cerrado y no admite modificaciones.");
  if (!order.confirmedAt) fail("INVALID_TRANSITION", "Primero vincula una cotización aceptada al pedido.");
  return order;
}
async function audit(tx: DbTransaction, ctx: Context, entityType: string, entityId: string, action: string, metadata: object = {}) {
  await tx.insert(auditEvents).values({ orgId: ctx.organizationId, actorId: ctx.userId, entityType, entityId, action, metadata });
}
async function moveOrder(tx: DbTransaction, ctx: Context, order: typeof orders.$inferSelect, status: string, reason?: string, deliveryDate?: string) {
  await tx.update(orders).set({ ...changed(orders), status, deliveredAt: status === "delivered" ? deliveryDate ? new Date(`${deliveryDate}T00:00:00-05:00`) : new Date() : null }).where(eq(orders.id, order.id));
  await tx.insert(orderStatusEvents).values({ orgId: ctx.organizationId, orderId: order.id, fromStatus: order.status, toStatus: status, actorId: ctx.userId, reason });
}
async function sumPayments(tx: DbTransaction, ctx: Context, orderId: string) {
  const [row] = await tx.select({ amount: sql<string>`coalesce(sum(${payments.amount}), 0)::text` }).from(payments)
    .where(and(eq(payments.orgId, ctx.organizationId), eq(payments.orderId, orderId), isNull(payments.voidedAt)));
  return new Decimal(row.amount);
}
async function sumCash(tx: DbTransaction, ctx: Context, source: "direct_cost" | "independent_loss", sourceId: string) {
  const column = source === "direct_cost" ? cashMovements.directCostId : cashMovements.independentLossId;
  const [row] = await tx.select({ amount: sql<string>`coalesce(sum(${cashMovements.amount}), 0)::text` }).from(cashMovements)
    .where(and(eq(cashMovements.orgId, ctx.organizationId), eq(column, sourceId), isNull(cashMovements.voidedAt)));
  return new Decimal(row.amount);
}
async function writeCash(tx: DbTransaction, ctx: Context, sourceKind: "payment" | "expense" | "direct_cost" | "independent_loss",
  sourceId: string, values: z.infer<typeof cashOutShape>, correctionOfId?: string) {
  const [row] = await tx.insert(cashMovements).values({ ...base(ctx), actorId: ctx.userId, sourceKind, direction: sourceKind === "payment" ? "in" : "out",
    businessDate: values.date, amount: values.amount, reference: values.reference, correctionOfId,
    paymentId: sourceKind === "payment" ? sourceId : null, expenseId: sourceKind === "expense" ? sourceId : null,
    directCostId: sourceKind === "direct_cost" ? sourceId : null, independentLossId: sourceKind === "independent_loss" ? sourceId : null }).returning();
  return row;
}
async function voidCash(tx: DbTransaction, ctx: Context, sourceKind: "payment" | "expense", sourceId: string, reason: string) {
  const column = sourceKind === "payment" ? cashMovements.paymentId : cashMovements.expenseId;
  await tx.update(cashMovements).set({ ...changed(cashMovements), voidedAt: new Date(), voidReason: reason })
    .where(and(eq(cashMovements.orgId, ctx.organizationId), eq(column, sourceId), isNull(cashMovements.voidedAt)));
}
async function addCost(tx: DbTransaction, ctx: Context, input: z.infer<ReturnType<typeof costInputSchema>>, correctionOfId?: string) {
  const order = await lockOrder(tx, ctx, input.orderId);
  if (order.deliveredAt) admin(ctx);
  if (input.attemptId) {
    const [attempt] = await tx.select({ id: productionAttempts.id }).from(productionAttempts).where(and(scoped(productionAttempts, ctx, input.attemptId), eq(productionAttempts.orderId, order.id)));
    if (!attempt) fail("NOT_FOUND", "Intento no encontrado en este pedido.");
  }
  if (input.filamentId) {
    const [filament] = await tx.select({ id: filaments.id }).from(filaments).where(scoped(filaments, ctx, input.filamentId));
    if (!filament) fail("NOT_FOUND", "Filamento no encontrado.");
  }
  const { cashOut, ...data } = input;
  const [cost] = await tx.insert(directCosts).values({ ...base(ctx), ...data, correctionOfId }).returning();
  if (cashOut) {
    admin(ctx);
    if (cost.cashNature !== "monetary") fail("INVALID_TRANSITION", "Un costo no monetario no genera un desembolso.");
    if (new Decimal(cashOut.amount).gt(cost.amount)) fail("DEPENDENCY_CONFLICT", "El desembolso supera el costo real.");
    await writeCash(tx, ctx, "direct_cost", cost.id, cashOut);
  }
  await audit(tx, ctx, "direct_cost", cost.id, correctionOfId ? "correct" : "create", { orderId: order.id, correctionOfId });
  return cost;
}
function costInputSchema() { return z.object(costShape).strict(); }
async function recordPayment(tx: DbTransaction, ctx: Context, order: typeof orders.$inferSelect,
  input: { paymentDate: string; amount: string; method?: string; reference?: string; notes?: string; idempotencyKey: string }, correctionOfId?: string) {
  const balance = new Decimal(order.agreedPrice!).minus(await sumPayments(tx, ctx, order.id));
  if (new Decimal(input.amount).gt(balance)) fail("PAYMENT_EXCEEDS_BALANCE", "El pago supera el saldo pendiente.");
  const [payment] = await tx.insert(payments).values({ ...base(ctx), ...input, orderId: order.id, actorId: ctx.userId, correctionOfId }).returning();
  await writeCash(tx, ctx, "payment", payment.id, { date: payment.paymentDate, amount: payment.amount, reference: payment.reference ?? undefined });
  await audit(tx, ctx, "payment", payment.id, correctionOfId ? "correct" : "create", { orderId: order.id, correctionOfId });
  return payment;
}
async function addExpense(tx: DbTransaction, ctx: Context, input: z.infer<ReturnType<typeof expenseInputSchema>>, correctionOfId?: string) {
  admin(ctx);
  if (input.classification === "opex" && !input.costBehavior) fail("VALIDATION_ERROR", "Clasifica el gasto como fijo o variable.");
  if (input.classification === "material_purchase" && input.costBehavior) fail("VALIDATION_ERROR", "Una compra de material no es gasto operativo.");
  const [member] = await tx.select({ id: memberships.id }).from(memberships).where(and(eq(memberships.organizationId, ctx.organizationId), eq(memberships.userId, input.responsibleUserId), eq(memberships.active, true)));
  if (!member) fail("NOT_FOUND", "Responsable no encontrado o inactivo.");
  const [expense] = await tx.insert(expenses).values({ ...base(ctx), ...input, costBehavior: input.costBehavior ?? null, correctionOfId }).returning();
  await writeCash(tx, ctx, "expense", expense.id, { date: expense.expenseDate, amount: expense.amount });
  await audit(tx, ctx, "expense", expense.id, correctionOfId ? "correct" : "create", { correctionOfId });
  return expense;
}
function expenseInputSchema() { return z.object(expenseShape).strict(); }

/** Caller owns transaction, membership recheck, idempotency reservation, commit and view invalidation. */
export async function executeProductionCommand(command: string, raw: Input, ctx: Context, tx: DbTransaction): Promise<Record<string, unknown>> {
  if (command === "orders.updateDeliveryDate" || command === "orders.close") {
    const input = command === "orders.close"
      ? parse({ orderId: id, confirmClose: z.literal(true) }, raw)
      : parse({ orderId: id, deliveryDate: day }, raw);
    const order = await lockOrder(tx, ctx, input.orderId);
    version(order.version, input.expectedVersion);
    if (order.status !== "delivered") fail("INVALID_TRANSITION", "Registra la entrega antes de cerrar o corregir su fecha.");
    if(command==="orders.close"&&!new Decimal(order.agreedPrice!).minus(await sumPayments(tx,ctx,order.id)).isZero()){
      fail("PAYMENT_PENDING","Registra el pago completo antes de cerrar el pedido.");
    }
    const update = "deliveryDate" in input
      ? { deliveredAt: new Date(`${input.deliveryDate}T00:00:00-05:00`) }
      : { closedAt: new Date(), status: "closed" };
    await tx.update(orders).set({ ...changed(orders), ...update }).where(eq(orders.id, order.id));
    if (command === "orders.close") await tx.insert(orderStatusEvents).values({ orgId: ctx.organizationId, orderId: order.id, fromStatus: order.status, toStatus: "closed", actorId: ctx.userId });
    await audit(tx, ctx, "order", order.id, command, { before: order.deliveredAt, ...update });
    return { id: order.id, entityType: "order" };
  }
  if (command === "production.startAttempt" || command === "production.reprint") {
    const input = parse({ orderId: id }, raw); const order = await lockOrder(tx, ctx, input.orderId);
    version(order.version, input.expectedVersion ?? input.orderVersion);
    const allowed = command.endsWith("reprint") ? "damaged" : "not_started";
    if (order.status !== allowed) fail("INVALID_TRANSITION", "El estado del pedido no permite iniciar este intento.");
    const [active] = await tx.select({ id: productionAttempts.id }).from(productionAttempts).where(and(eq(productionAttempts.orderId, order.id), eq(productionAttempts.status, "printing")));
    if (active) fail("DEPENDENCY_CONFLICT", "Ya existe un intento activo.");
    const [count] = await tx.select({ value: sql<number>`coalesce(max(${productionAttempts.attemptNumber}), 0)` }).from(productionAttempts).where(eq(productionAttempts.orderId, order.id));
    const [attempt] = await tx.insert(productionAttempts).values({ ...base(ctx), orderId: order.id, attemptNumber: count.value + 1, status: "printing", startedAt: new Date() }).returning();
    await moveOrder(tx, ctx, order, "printing"); await audit(tx, ctx, "production_attempt", attempt.id, command, { orderId: order.id });
    return { id: attempt.id, entityType: "production_attempt", orderId: order.id };
  }
  if (command === "production.completeAttempt" || command === "production.failAttempt") {
    const input = parse({ attemptId: id, actualSeconds: seconds.optional(), reason: description.optional(), completeness: z.enum(["complete", "incomplete"]).optional(), costs: z.array(costInputSchema()).max(100).optional() }, raw);
    const [found] = await tx.select().from(productionAttempts).where(scoped(productionAttempts, ctx, input.attemptId));
    if (!found) fail("NOT_FOUND", "Intento no encontrado.");
    const order = await lockOrder(tx, ctx, found.orderId); version(order.version, input.orderVersion ?? input.expectedVersion);
    const [attempt] = await tx.select().from(productionAttempts).where(eq(productionAttempts.id, found.id)).for("update");
    if (attempt.status !== "printing" || order.status !== "printing") fail("INVALID_TRANSITION", "El intento ya está cerrado.");
    const failed = command.endsWith("failAttempt");
    if (failed && !input.reason) fail("VALIDATION_ERROR", "Describe la causa del fallo.");
    for (const cost of input.costs ?? []) {
      if (cost.orderId !== order.id || (cost.attemptId && cost.attemptId !== attempt.id)) fail("VALIDATION_ERROR", "El costo debe pertenecer a este intento.");
      await addCost(tx, ctx, { ...cost, attemptId: attempt.id });
    }
    const completedAt = new Date();
    if (input.actualSeconds === undefined && !attempt.startedAt) fail("VALIDATION_ERROR", "El intento no tiene una fecha de inicio registrada.");
    const actualSeconds = input.actualSeconds === undefined ? BigInt(Math.max(0, Math.floor((completedAt.getTime() - attempt.startedAt!.getTime()) / 1000))) : BigInt(input.actualSeconds);
    await tx.update(productionAttempts).set({ ...changed(productionAttempts), status: failed ? "failed" : "success", completedAt, actualSeconds, failureReason: failed ? input.reason : null }).where(eq(productionAttempts.id, attempt.id));
    if (input.completeness) await tx.update(orders).set({ costCompleteness: input.completeness }).where(eq(orders.id, order.id));
    await moveOrder(tx, ctx, order, failed ? "damaged" : "finished", input.reason);
    await audit(tx, ctx, "production_attempt", attempt.id, command, { orderId: order.id });
    return { id: attempt.id, entityType: "production_attempt", orderId: order.id };
  }
  if (command === "orders.transition") {
    const input = parse({ id: id.optional(), orderId: id.optional(), target: z.enum(["not_started", "printing", "finished", "delivered", "damaged"]), deliveryDate: day.optional(), reason: description.optional(), acknowledgeIncompleteCosts: z.boolean().optional() }, raw);
    const orderId = input.orderId ?? input.id; if (!orderId) fail("VALIDATION_ERROR", "Se requiere el pedido.");
    const order = await lockOrder(tx, ctx, orderId); version(order.version, input.expectedVersion);
    if (order.status === "finished" && input.target === "delivered") {
      // Delivery uses the linked quotation cost; no separate cost confirmation is needed.
    } else if (order.status === "delivered" && input.target === "finished") {
      admin(ctx); if (!input.reason) fail("VALIDATION_ERROR", "Indica el motivo de reapertura.");
    } else fail("INVALID_TRANSITION", "Usa los comandos de producción para cambiar este estado.");
    await moveOrder(tx, ctx, order, input.target, input.reason, input.deliveryDate); await audit(tx, ctx, "order", order.id, command, { from: order.status, to: input.target, reason: input.reason, deliveryDate: input.deliveryDate });
    return { id: order.id, entityType: "order" };
  }
  if (command === "production.setCostCompleteness") {
    const input = parse({ orderId: id, completeness: z.enum(["complete", "incomplete"]), reason: description }, raw);
    const order = await lockOrder(tx, ctx, input.orderId); version(order.version, input.expectedVersion);
    if (order.deliveredAt) admin(ctx);
    await tx.update(orders).set({ ...changed(orders), costCompleteness: input.completeness }).where(eq(orders.id, order.id));
    await audit(tx, ctx, "order", order.id, command, { completeness: input.completeness, reason: input.reason });
    return { id: order.id, entityType: "order" };
  }
  if (command === "production.addCost") {
    const input = parse(costShape, raw); const { idempotencyKey: _key, expectedVersion: _version, orderVersion: _ov, ...data } = input;
    const cost = await addCost(tx, ctx, data); return { id: cost.id, entityType: "direct_cost", orderId: cost.orderId };
  }
  if (command === "production.correctCost") {
    const input = parse({ costId: id, reason: description, replacement: costInputSchema() }, raw);
    const [found] = await tx.select().from(directCosts).where(scoped(directCosts, ctx, input.costId)); if (!found) fail("NOT_FOUND", "Costo no encontrado.");
    const order = await lockOrder(tx, ctx, found.orderId);
    const [old] = await tx.select().from(directCosts).where(eq(directCosts.id, found.id)).for("update"); version(old.version, input.expectedVersion);
    if (old.voidedAt) fail("DEPENDENCY_CONFLICT", "El costo ya está corregido.");
    if (input.replacement.orderId !== old.orderId) fail("VALIDATION_ERROR", "La corrección conserva el pedido.");
    if (input.replacement.cashOut) fail("VALIDATION_ERROR", "La corrección no registra nuevos desembolsos.");
    const spent = await sumCash(tx, ctx, "direct_cost", old.id);
    if (spent.gt(0) || order.deliveredAt) admin(ctx);
    if (spent.gt(input.replacement.amount) || (spent.gt(0) && input.replacement.cashNature !== "monetary")) fail("DEPENDENCY_CONFLICT", "Primero corrige el desembolso erróneo; el costo no puede ser menor a lo pagado.");
    await tx.update(directCosts).set({ ...changed(directCosts), voidedAt: new Date(), voidReason: input.reason }).where(eq(directCosts.id, old.id));
    const replacement = await addCost(tx, ctx, input.replacement, old.id);
    await tx.update(cashMovements).set({ ...changed(cashMovements), directCostId: replacement.id }).where(and(eq(cashMovements.directCostId, old.id), isNull(cashMovements.voidedAt)));
    await audit(tx, ctx, "direct_cost", old.id, "void_for_correction", { reason: input.reason, replacementId: replacement.id });
    return { id: replacement.id, entityType: "direct_cost", orderId: old.orderId };
  }
  if (command === "production.recordDirectCashOut") {
    admin(ctx); const input = parse({ costId: id, date: day, amount: integerMoney, reference: z.string().max(200).optional() }, raw);
    const [found] = await tx.select().from(directCosts).where(scoped(directCosts, ctx, input.costId)); if (!found) fail("NOT_FOUND", "Costo no encontrado.");
    await lockOrder(tx, ctx, found.orderId);
    const [cost] = await tx.select().from(directCosts).where(eq(directCosts.id, found.id)).for("update");
    if (cost.voidedAt || cost.cashNature !== "monetary") fail("INVALID_TRANSITION", "Este costo no permite desembolsos.");
    if ((await sumCash(tx, ctx, "direct_cost", cost.id)).plus(input.amount).gt(cost.amount)) fail("DEPENDENCY_CONFLICT", "El desembolso supera el costo pendiente.");
    const movement = await writeCash(tx, ctx, "direct_cost", cost.id, input); await audit(tx, ctx, "cash_movement", movement.id, command, { sourceId: cost.id });
    return { id: movement.id, entityType: "cash_movement" };
  }
  if (command === "payments.create" || command === "payments.settleBalance") {
    admin(ctx); const input = parse({ orderId: id, paymentDate: day, amount: integerMoney.optional(), method: z.string().max(200).optional(), reference: z.string().max(200).optional(), notes: note.optional() }, raw);
    const order = await lockOrder(tx, ctx, input.orderId); let amount = input.amount;
    if (command === "payments.settleBalance") amount = new Decimal(order.agreedPrice!).minus(await sumPayments(tx, ctx, order.id)).toFixed(0);
    if (!amount || new Decimal(amount).lte(0)) fail("VALIDATION_ERROR", "No existe un importe positivo para registrar.");
    if (!input.idempotencyKey) fail("VALIDATION_ERROR", "Se requiere clave de idempotencia.");
    const payment = await recordPayment(tx, ctx, order, { ...input, amount, idempotencyKey: input.idempotencyKey });
    return { id: payment.id, entityType: "payment", orderId: order.id };
  }
  if (command === "payments.correct") {
    admin(ctx); const input = parse({ paymentId: id, reason: description, replacement: z.object({ paymentDate: day, amount: integerMoney, method: z.string().max(200).optional(), reference: z.string().max(200).optional(), notes: note.optional() }).strict().optional() }, raw);
    const [found] = await tx.select().from(payments).where(scoped(payments, ctx, input.paymentId)); if (!found) fail("NOT_FOUND", "Pago no encontrado.");
    const order = await lockOrder(tx, ctx, found.orderId); const [old] = await tx.select().from(payments).where(eq(payments.id, found.id)).for("update");
    if (old.voidedAt) fail("DEPENDENCY_CONFLICT", "El pago ya está corregido.");
    await tx.update(payments).set({ ...changed(payments), voidedAt: new Date(), voidReason: input.reason }).where(eq(payments.id, old.id)); await voidCash(tx, ctx, "payment", old.id, input.reason);
    let replacementId: string | undefined;
    if (input.replacement) {
      if (!input.idempotencyKey) fail("VALIDATION_ERROR", "Se requiere clave de idempotencia.");
      replacementId = (await recordPayment(tx, ctx, order, { ...input.replacement, idempotencyKey: input.idempotencyKey }, old.id)).id;
    }
    await audit(tx, ctx, "payment", old.id, command, { reason: input.reason, replacementId });
    return { id: replacementId ?? old.id, entityType: "payment", orderId: order.id };
  }
  if (command === "expenses.create") {
    const input = parse(expenseShape, raw); const { idempotencyKey: _k, expectedVersion: _v, orderVersion: _o, ...data } = input;
    const expense = await addExpense(tx, ctx, data); return { id: expense.id, entityType: "expense" };
  }
  if (command === "expenses.update" || command === "expenses.void") {
    admin(ctx); const input = parse({ expenseId: id, reason: description, replacement: expenseInputSchema().optional() }, raw);
    const [old] = await tx.select().from(expenses).where(scoped(expenses, ctx, input.expenseId)).for("update"); if (!old) fail("NOT_FOUND", "Gasto no encontrado.");
    version(old.version, input.expectedVersion); if (old.voidedAt) fail("DEPENDENCY_CONFLICT", "El gasto ya está anulado.");
    if (command === "expenses.update" && !input.replacement) fail("VALIDATION_ERROR", "Se requieren datos corregidos del gasto.");
    if (command === "expenses.void" && input.replacement) fail("VALIDATION_ERROR", "La anulación no admite reemplazo.");
    await tx.update(expenses).set({ ...changed(expenses), voidedAt: new Date(), voidReason: input.reason }).where(eq(expenses.id, old.id)); await voidCash(tx, ctx, "expense", old.id, input.reason);
    const replacement = input.replacement ? await addExpense(tx, ctx, input.replacement, old.id) : null;
    await audit(tx, ctx, "expense", old.id, command, { reason: input.reason, replacementId: replacement?.id });
    return { id: replacement?.id ?? old.id, entityType: "expense" };
  }
  if (command === "losses.create" || command === "losses.correct") {
    admin(ctx);
    const input = command === "losses.create" ? parse(lossShape, raw) : parse({ lossId: id, reason: description, replacement: z.object(lossShape).strict() }, raw);
    const data = "replacement" in input ? input.replacement : input; let oldId: string | undefined;
    if ("lossId" in input) {
      const [old] = await tx.select().from(independentLosses).where(scoped(independentLosses, ctx, input.lossId)).for("update"); if (!old) fail("NOT_FOUND", "Pérdida no encontrada.");
      version(old.version, input.expectedVersion); if (old.voidedAt) fail("DEPENDENCY_CONFLICT", "La pérdida ya está corregida.");
      if (data.cashOut) fail("VALIDATION_ERROR", "La corrección conserva la caja; no registra otro desembolso.");
      if ((await sumCash(tx, ctx, "independent_loss", old.id)).gt(data.amount)) fail("DEPENDENCY_CONFLICT", "La pérdida no puede ser menor a su desembolso.");
      oldId = old.id; await tx.update(independentLosses).set({ ...changed(independentLosses), voidedAt: new Date(), voidReason: input.reason }).where(eq(independentLosses.id, old.id));
      await audit(tx, ctx, "independent_loss", old.id, "void_for_correction", { reason: input.reason });
    }
    const [loss] = await tx.insert(independentLosses).values({ ...base(ctx), actorId: ctx.userId, recognizedDate: data.recognizedDate, category: data.category, description: data.description, amount: data.amount, originReference: data.originReference, correctionOfId: oldId }).returning();
    if (oldId) await tx.update(cashMovements).set({ ...changed(cashMovements), independentLossId: loss.id }).where(and(eq(cashMovements.independentLossId, oldId), isNull(cashMovements.voidedAt)));
    if (data.cashOut) {
      if (new Decimal(data.cashOut.amount).gt(loss.amount)) fail("DEPENDENCY_CONFLICT", "El desembolso supera la pérdida.");
      await writeCash(tx, ctx, "independent_loss", loss.id, data.cashOut);
    }
    await audit(tx, ctx, "independent_loss", loss.id, command, { correctionOfId: oldId }); return { id: loss.id, entityType: "independent_loss" };
  }
  if (command === "cash.correctDirectOut") {
    admin(ctx); const input = parse({ movementId: id, sourceId: id, reason: description, replacement: cashOutShape.optional() }, raw);
    const [found] = await tx.select().from(cashMovements).where(scoped(cashMovements, ctx, input.movementId)); if (!found) fail("NOT_FOUND", "Movimiento no encontrado.");
    if (found.sourceKind !== "direct_cost" && found.sourceKind !== "independent_loss") fail("INVALID_TRANSITION", "Corrige este movimiento desde su pago o gasto de origen.");
    const sourceKind = found.sourceKind; const sourceId = found.directCostId ?? found.independentLossId;
    if (sourceId !== input.sourceId) fail("NOT_FOUND", "La fuente no coincide.");
    let sourceAmount: string;
    if (sourceKind === "direct_cost") {
      const [cost] = await tx.select().from(directCosts).where(scoped(directCosts, ctx, input.sourceId)); if (!cost) fail("NOT_FOUND", "Costo no encontrado.");
      await lockOrder(tx, ctx, cost.orderId); const [locked] = await tx.select().from(directCosts).where(eq(directCosts.id, cost.id)).for("update");
      if (locked.voidedAt) fail("DEPENDENCY_CONFLICT", "La fuente está anulada."); sourceAmount = locked.amount;
    } else {
      const [loss] = await tx.select().from(independentLosses).where(scoped(independentLosses, ctx, input.sourceId)).for("update"); if (!loss) fail("NOT_FOUND", "Pérdida no encontrada.");
      if (loss.voidedAt) fail("DEPENDENCY_CONFLICT", "La fuente está anulada."); sourceAmount = loss.amount;
    }
    const [old] = await tx.select().from(cashMovements).where(eq(cashMovements.id, found.id)).for("update"); version(old.version, input.expectedVersion);
    if (old.voidedAt) fail("DEPENDENCY_CONFLICT", "El movimiento ya está corregido.");
    await tx.update(cashMovements).set({ ...changed(cashMovements), voidedAt: new Date(), voidReason: input.reason }).where(eq(cashMovements.id, old.id));
    let replacementId: string | undefined;
    if (input.replacement) {
      if ((await sumCash(tx, ctx, sourceKind, input.sourceId)).plus(input.replacement.amount).gt(sourceAmount)) fail("DEPENDENCY_CONFLICT", "El egreso supera la fuente económica.");
      replacementId = (await writeCash(tx, ctx, sourceKind, input.sourceId, input.replacement, old.id)).id;
    }
    await audit(tx, ctx, "cash_movement", old.id, command, { reason: input.reason, replacementId, sourceId });
    return { id: replacementId ?? old.id, entityType: "cash_movement" };
  }
  return fail("VALIDATION_ERROR", "Comando de producción o finanzas desconocido.");
}
