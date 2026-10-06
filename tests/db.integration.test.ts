import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
import { loadEnvFile } from "node:process";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { and, eq, isNull, sql } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";
import { executeProductionCommand } from "../src/lib/production-service";

try { loadEnvFile(".env.local"); } catch { /* CI provides environment directly. */ }
const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("TEST_DATABASE_URL es obligatoria para integración PostgreSQL real.");
// This suite resets only a deliberately named disposable database, never dev/production.
if (!new URL(url).pathname.endsWith("_test")) throw new Error("La base de integración debe terminar en _test.");
const pool = new Pool({ connectionString: url, max: 5 });
const db = drizzle(pool, { schema });
const ctx = { userId: "integration-admin", organizationId: randomUUID(), role: "administrator" as const };
const operator = { ...ctx, userId: "integration-operator", role: "operator" as const };
let customerId: string, orderId: string, quoteId: string, revisionId: string;
const command = (name: string, input: Record<string, unknown>, actor: typeof ctx | typeof operator = ctx) => db.transaction((tx) => executeProductionCommand(name, input, actor, tx));
const positiveCost = (amount: string) => ({ orderId, category: "material", economicClassification: "variable", cashNature: "monetary", description: "Consumo real", incurredDate: "2026-10-02", amount });

beforeAll(async () => { await migrate(db, { migrationsFolder: "./drizzle" }); });
beforeEach(async () => {
  await pool.query('TRUNCATE "cash_movement", "payment", "direct_cost", "production_attempt", "independent_loss", "expense", "order_status_event", "order", "quote_material", "quote_postprocess", "quote_price_option", "quote_revision", "quote", "customer", "filament", "mutation_request", "audit_event", "business_settings", "document_counter", "membership", "organization", "session", "account", "verification", "rate_limit", "user" CASCADE');
  await db.insert(schema.user).values([{ id: ctx.userId, name: "Integration admin", email: "admin@example.test" }, { id: operator.userId, name: "Integration operator", email: "operator@example.test" }]);
  await db.insert(schema.organizations).values({ id: ctx.organizationId, name: "Disposable test company" });
  await db.insert(schema.memberships).values([{ organizationId: ctx.organizationId, userId: ctx.userId, role: ctx.role }, { organizationId: ctx.organizationId, userId: operator.userId, role: operator.role }]);
  const base = { orgId: ctx.organizationId, createdBy: ctx.userId };
  [customerId, quoteId, revisionId, orderId] = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
  await db.insert(schema.customers).values({ ...base, id: customerId, name: "Test customer", contactPhone: "3000000000" });
  await db.insert(schema.quotes).values({ ...base, id: quoteId, sequenceNumber: 1n, code: "COT-000001", customerId });
  await db.insert(schema.quoteRevisions).values({ ...base, id: revisionId, quoteId, revisionNumber: 1, status: "accepted", projectName: "Test", description: "Test", printSeconds: 3600n, formulaSnapshot: { version: 1 }, materialCost: "0", energyCost: "0", machineCost: "0", contingencyCost: "0", postprocessCost: "0", estimatedCost: "0", quotedPrice: "1000", businessDate: "2026-10-02" });
  await db.update(schema.quotes).set({ currentRevisionId: revisionId }).where(eq(schema.quotes.id, quoteId));
  await db.insert(schema.orders).values({ ...base, id: orderId, sequenceNumber: 1n, code: "PED-000001", customerId, sourceQuoteId: quoteId, acceptedRevisionId: revisionId, title: "Test order", orderDate: "2026-10-02", confirmedAt: new Date(), agreedPrice: "1000" });
});
afterAll(async () => { await pool.end(); });

describe("PostgreSQL integrity and real commands", () => {
  it("delivers using quoted costs without registering or confirming separate costs", async () => {
    await db.update(schema.quoteRevisions).set({materialCost:"200",estimatedCost:"200"}).where(eq(schema.quoteRevisions.id,revisionId));
    const attempt=await command("production.startAttempt",{orderId,expectedVersion:1});
    await command("production.completeAttempt",{attemptId:attempt.id,orderVersion:2});
    await command("orders.transition",{orderId,expectedVersion:3,target:"delivered",deliveryDate:"2026-10-04"});
    expect((await db.select().from(schema.orders))[0].status).toBe("delivered");
    expect(await db.select().from(schema.directCosts)).toHaveLength(0);
    expect(await db.select().from(schema.cashMovements)).toHaveLength(0);
  });
  it("prevents a second order from converting the same quote", async () => {
    await expect(db.insert(schema.orders).values({ orgId: ctx.organizationId, createdBy: ctx.userId, sequenceNumber: 2n, code: "PED-000002", customerId, sourceQuoteId: quoteId, acceptedRevisionId: revisionId, title: "Duplicate", orderDate: "2026-10-02", confirmedAt: new Date(), agreedPrice: "1000" })).rejects.toThrow();
  });
  it("rejects current revision from another quote", async () => {
    const other = randomUUID(); await db.insert(schema.quotes).values({ orgId: ctx.organizationId, createdBy: ctx.userId, id: other, sequenceNumber: 2n, code: "COT-000002" });
    await expect(db.update(schema.quotes).set({ currentRevisionId: revisionId }).where(eq(schema.quotes.id, other))).rejects.toThrow();
  });
  it("serializes simultaneous payments and prevents overpayment", async () => {
    const input = { orderId, paymentDate: "2026-10-02", amount: "700" };
    const outcomes = await Promise.allSettled([command("payments.create", { ...input, idempotencyKey: randomUUID() }), command("payments.create", { ...input, idempotencyKey: randomUUID() })]);
    expect(outcomes.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const [row] = await db.select({ sum: sql<string>`sum(${schema.payments.amount})::text` }).from(schema.payments); expect(row.sum).toBe("700");
    expect(await db.select().from(schema.cashMovements)).toHaveLength(1);
  });
  it("operator cannot register a payment and transaction rolls back", async () => {
    await expect(db.transaction((tx) => executeProductionCommand("payments.create", { orderId, paymentDate: "2026-10-02", amount: "100", idempotencyKey: randomUUID() }, operator, tx))).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await db.select().from(schema.payments)).toHaveLength(0); expect(await db.select().from(schema.cashMovements)).toHaveLength(0);
  });
  it("records elapsed time automatically when finishing without manual seconds", async()=>{
    const first=await command("production.startAttempt",{orderId,expectedVersion:1});
    await db.update(schema.productionAttempts).set({startedAt:new Date(Date.now()-65000)}).where(eq(schema.productionAttempts.id,String(first.id)));
    await command("production.completeAttempt",{attemptId:first.id,orderVersion:2});
    const [attempt]=await db.select().from(schema.productionAttempts).where(eq(schema.productionAttempts.id,String(first.id)));
    expect(attempt.actualSeconds).toBeGreaterThanOrEqual(65n);expect(attempt.actualSeconds).toBeLessThan(75n);expect(attempt.status).toBe("success");
  });
  it("configures the delivery date and permanently blocks edits after closing", async () => {
    await expect(command("orders.close", { orderId, expectedVersion: 1, confirmClose: true })).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
    const attempt = await command("production.startAttempt", { orderId, expectedVersion: 1 });
    await command("production.completeAttempt", { attemptId: attempt.id, orderVersion: 2 });
    await command("orders.transition", { orderId, expectedVersion: 3, target: "delivered", deliveryDate: "2026-10-04", acknowledgeIncompleteCosts: true });
    let [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
    expect(order.deliveredAt?.toISOString()).toBe("2026-10-04T05:00:00.000Z");
    await expect(command("orders.updateDeliveryDate", { orderId, expectedVersion: 4, deliveryDate: "2026-02-30" })).rejects.toThrow();
    await command("orders.updateDeliveryDate", { orderId, expectedVersion: 4, deliveryDate: "2026-10-03" });
    await expect(command("orders.close", { orderId, expectedVersion: 4, confirmClose: true })).rejects.toMatchObject({ code: "VERSION_CONFLICT" });
    await command("orders.close", { orderId, expectedVersion: 5, confirmClose: true });
    [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
    expect(order.closedAt).toBeInstanceOf(Date);
    expect(order.status).toBe("closed");
    expect(order.deliveredAt?.toISOString()).toBe("2026-10-03T05:00:00.000Z");
    for (const [name, input] of [
      ["orders.updateDeliveryDate", { orderId, expectedVersion: 6, deliveryDate: "2026-10-02" }],
      ["orders.transition", { orderId, expectedVersion: 6, target: "finished", reason: "Reabrir" }],
      ["production.addCost", positiveCost("100")],
      ["production.setCostCompleteness", { orderId, expectedVersion: 6, completeness: "complete", reason: "Cambio" }],
      ["payments.create", { orderId, paymentDate: "2026-10-03", amount: "100", idempotencyKey: randomUUID() }],
    ] as [string, Record<string, unknown>][]) {
      await expect(command(name, input)).rejects.toMatchObject({ code: "ORDER_CLOSED" });
    }
    const { executeQuoteCommand } = await import("../src/lib/quote-service");
    const access = { ...ctx, membershipId: randomUUID(), sessionId: "test-session", name: "Integration admin", email: "admin@example.test" };
    for (const [name, input] of [
      ["orders.updateMetadata", { orderId, expectedVersion: 6, title: "Editado" }],
      ["orders.updateCommercial", { orderId, expectedVersion: 6, agreedPrice: "1500", estimatedCost: "100", reason: "Cambio" }],
      ["orders.archive", { orderId, expectedVersion: 6 }],
    ] as [string, Record<string, unknown>][]) {
      await expect(db.transaction(tx => executeQuoteCommand(name, { ...input, idempotencyKey: randomUUID() }, access, tx))).rejects.toMatchObject({ code: "ORDER_CLOSED" });
    }
    expect((await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)))[0].version).toBe(6);
  });
  it("failed print reprints within same order and retains failed cost exactly once", async () => {
    const first = await command("production.startAttempt", { orderId, expectedVersion: 1 });
    await command("production.addCost", { ...positiveCost("100"), attemptId: first.id });
    await command("production.failAttempt", { attemptId: first.id, actualSeconds: "3600", reason: "Layer adhesion", orderVersion: 2 });
    const second = await command("production.reprint", { orderId, expectedVersion: 3 });
    await command("production.addCost", { ...positiveCost("200"), attemptId: second.id });
    await command("production.completeAttempt", { attemptId: second.id, actualSeconds: "3600", orderVersion: 4, completeness: "complete" });
    await command("orders.transition", { orderId, expectedVersion: 5, target: "delivered" });
    const attempts = await db.select().from(schema.productionAttempts); expect(attempts.map((a) => a.status)).toEqual(["failed", "success"]);
    const [sum] = await db.select({ amount: sql<string>`sum(${schema.directCosts.amount})::text` }).from(schema.directCosts); expect(new Number(sum.amount).valueOf()).toBe(300);
    expect(await db.select().from(schema.orders)).toHaveLength(1); expect(await db.select().from(schema.cashMovements)).toHaveLength(0);
  });
  it("100→120 correction preserves original and sums only replacement", async () => {
    const old = await command("production.addCost", positiveCost("100"));
    await command("production.correctCost", { costId: old.id, expectedVersion: 1, reason: "Digitación", replacement: positiveCost("120") });
    expect(await db.select().from(schema.directCosts)).toHaveLength(2);
    const [sum] = await db.select({ amount: sql<string>`sum(${schema.directCosts.amount})::text` }).from(schema.directCosts).where(isNull(schema.directCosts.voidedAt)); expect(sum.amount).toBe("120.000000");
  });
  it("cost correction cannot go below actual cash; cash correction permits recovery", async () => {
    const old = await command("production.addCost", { ...positiveCost("100"), cashOut: { date: "2026-10-02", amount: "90" } });
    await expect(command("production.correctCost", { costId: old.id, expectedVersion: 1, reason: "Error", replacement: positiveCost("80") })).rejects.toMatchObject({ code: "DEPENDENCY_CONFLICT" });
    const [movement] = await db.select().from(schema.cashMovements);
    await command("cash.correctDirectOut", { movementId: movement.id, sourceId: old.id, expectedVersion: 1, reason: "Egreso digitado incorrectamente", replacement: { date: "2026-10-02", amount: "70" } });
    const corrected = await command("production.correctCost", { costId: old.id, expectedVersion: 1, reason: "Costo digitado incorrectamente", replacement: positiveCost("80") });
    const [active] = await db.select().from(schema.cashMovements).where(isNull(schema.cashMovements.voidedAt)); expect(active.amount).toBe("70"); expect(active.directCostId).toBe(corrected.id);
  });
  it("material purchase creates one cash out and consumption creates no second out", async () => {
    await command("expenses.create", { expenseDate: "2026-10-02", description: "Rollo", classification: "material_purchase", category: "filament", amount: "80000", responsibleUserId: ctx.userId });
    await command("production.addCost", positiveCost("8000"));
    expect(await db.select().from(schema.cashMovements)).toHaveLength(1); expect(await db.select().from(schema.expenses).where(eq(schema.expenses.classification, "opex"))).toHaveLength(0);
  });
  it("payment correction replaces positive ledger and matching cash atomically", async () => {
    const original = await command("payments.create", { orderId, paymentDate: "2026-10-02", amount: "100", idempotencyKey: randomUUID() });
    await command("payments.correct", { paymentId: original.id, reason: "Importe digitado", idempotencyKey: randomUUID(), replacement: { paymentDate: "2026-10-02", amount: "120" } });
    const activePayments = await db.select().from(schema.payments).where(isNull(schema.payments.voidedAt)); expect(activePayments).toHaveLength(1); expect(activePayments[0].amount).toBe("120");
    const activeCash = await db.select().from(schema.cashMovements).where(isNull(schema.cashMovements.voidedAt)); expect(activeCash).toHaveLength(1); expect(activeCash[0].amount).toBe("120");
  });
  it("idempotency records enforce actor/operation/key uniqueness", async () => {
    const request = { orgId: ctx.organizationId, actorId: ctx.userId, operation: "production.startAttempt", idempotencyKey: randomUUID(), inputHash: "normalized-hash", resultEntityType: "order", resultEntityId: orderId, resultStatus: "committed" };
    await db.insert(schema.mutationRequests).values(request); await expect(db.insert(schema.mutationRequests).values(request)).rejects.toThrow();
  });
  it("provisional order rejects payments and OPEX requires explicit fixed/variable classification", async () => {
    const provisionalId = randomUUID(); await db.insert(schema.orders).values({ orgId: ctx.organizationId, createdBy: ctx.userId, id: provisionalId, sequenceNumber: 2n, code: "PED-000002", customerId, title: "Intake", orderDate: "2026-10-02" });
    await expect(command("payments.create", { orderId: provisionalId, paymentDate: "2026-10-02", amount: "10", idempotencyKey: randomUUID() })).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
    await expect(command("expenses.create", { expenseDate: "2026-10-02", description: "Energy", classification: "opex", category: "energy", amount: "100", responsibleUserId: ctx.userId })).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});

