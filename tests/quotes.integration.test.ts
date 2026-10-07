import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { loadEnvFile } from "node:process";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { and, eq, sql } from "drizzle-orm";
import { PDFDocument } from "pdf-lib";
import * as s from "../src/lib/db/schema";
import type { DbTransaction } from "../src/lib/db";
import type { AccessContext } from "../src/lib/access";
import { executeQuoteCommand } from "../src/lib/quote-service";
import { defaultFormula } from "../src/lib/finance";
import { renderCommercialQuote } from "../src/lib/quote-pdf";
import * as pdfModule from "../src/lib/quote-pdf";

vi.mock("../src/lib/access", async (importOriginal) => ({
  ...await importOriginal<typeof import("../src/lib/access")>(),
  requireAccess: async () => activeContext,
}));
vi.mock("../src/lib/db", async (importOriginal) => ({
  ...await importOriginal<typeof import("../src/lib/db")>(), getDb: () => pdfDb,
}));

try { loadEnvFile(".env.local"); } catch { /* CI injects test environment. */ }
const connection = process.env.TEST_DATABASE_URL;
if (!connection || !new URL(connection).pathname.endsWith("_test")) throw new Error("Se requiere PostgreSQL desechable TEST_DATABASE_URL terminada en _test.");
const pool = new Pool({ connectionString: connection, max: 5 });
const db = drizzle(pool, { schema: s });
let pdfDb: typeof db | DbTransaction = db;
let activeContext: AccessContext;
const rollback = new Error("Private fixture rollback");

async function confirmedOrder(tx: DbTransaction, ctx: AccessContext) {
  const quoteId=(await executeQuoteCommand("quotes.createDraft",input(),ctx,tx)).id;
  await executeQuoteCommand("quotes.publish",{quoteId,expectedVersion:1,idempotencyKey:randomUUID()},ctx,tx);
  await executeQuoteCommand("quotes.accept",{quoteId,expectedVersion:2,idempotencyKey:randomUUID()},ctx,tx);
  const orderId=(await executeQuoteCommand("orders.convertQuote",{quoteId,expectedVersion:3,idempotencyKey:randomUUID()},ctx,tx)).id;
  return {quoteId,orderId};
}

describe("ajustes comerciales del pedido",()=>{
  it("conserva la cotización, registra motivo y actualiza precio y costo estimado",async()=>rolledBack(async(tx,ctx)=>{
    const {quoteId,orderId}=await confirmedOrder(tx,ctx);
    const [original]=await tx.select().from(s.quoteRevisions).where(eq(s.quoteRevisions.quoteId,quoteId));
    await executeQuoteCommand("orders.updateCommercial",{orderId,expectedVersion:1,estimatedCost:"14000.500000",agreedPrice:"40000",reason:"Acabado adicional acordado",idempotencyKey:randomUUID()},ctx,tx);
    const [order]=await tx.select().from(s.orders).where(eq(s.orders.id,orderId));
    expect(order.agreedPrice).toBe("40000");expect(order.estimatedCostOverride).toBe("14000.500000");expect(order.version).toBe(2);
    const [preserved]=await tx.select().from(s.quoteRevisions).where(eq(s.quoteRevisions.id,original.id));expect(preserved).toEqual(original);
    const [audit]=await tx.select().from(s.auditEvents).where(and(eq(s.auditEvents.entityId,orderId),eq(s.auditEvents.action,"orders.updateCommercial")));
    expect(audit.metadata).toMatchObject({reason:"Acabado adicional acordado",before:{agreedPrice:original.quotedPrice},after:{agreedPrice:"40000"}});
    await expect(executeQuoteCommand("orders.updateCommercial",{orderId,expectedVersion:1,estimatedCost:"14000",agreedPrice:"45000",reason:"Edición obsoleta",idempotencyKey:randomUUID()},ctx,tx)).rejects.toMatchObject({code:"VERSION_CONFLICT"});
  }));
  it("rechaza operadores, pedidos provisionales y precios inferiores al dinero recibido",async()=>rolledBack(async(tx,ctx)=>{
    const {orderId}=await confirmedOrder(tx,ctx);
    const payload={orderId,expectedVersion:1,estimatedCost:"10000",agreedPrice:"5000",reason:"Prueba",idempotencyKey:randomUUID()};
    await expect(executeQuoteCommand("orders.updateCommercial",payload,{...ctx,role:"operator"},tx)).rejects.toMatchObject({code:"FORBIDDEN"});
    await tx.insert(s.payments).values({orgId:ctx.organizationId,createdBy:ctx.userId,orderId,actorId:ctx.userId,paymentDate:"2026-10-04",amount:"10000",idempotencyKey:randomUUID()});
    await expect(executeQuoteCommand("orders.updateCommercial",payload,ctx,tx)).rejects.toMatchObject({code:"DEPENDENCY_CONFLICT"});
    const provisional=(await executeQuoteCommand("orders.createIntake",{customerId:fixtureIds.customer,title:"Provisional",orderDate:"2026-10-04",idempotencyKey:randomUUID()},ctx,tx)).id;
    await expect(executeQuoteCommand("orders.updateCommercial",{...payload,orderId:provisional},ctx,tx)).rejects.toMatchObject({code:"INVALID_TRANSITION"});
  }));
  it("no vincula a un segundo pedido una cotización utilizada",async()=>rolledBack(async(tx,ctx)=>{
    const {quoteId}=await confirmedOrder(tx,ctx);
    const provisional=(await executeQuoteCommand("orders.createIntake",{customerId:fixtureIds.customer,title:"Otro pedido",orderDate:"2026-10-04",idempotencyKey:randomUUID()},ctx,tx)).id;
    await expect(executeQuoteCommand("orders.convertQuote",{quoteId,expectedVersion:3,existingIntakeId:provisional,idempotencyKey:randomUUID()},ctx,tx)).rejects.toMatchObject({code:"DEPENDENCY_CONFLICT"});
  }));
});
const fixtureIds = { actor: randomUUID(), member: randomUUID(), customer: randomUUID(), filament: randomUUID() };

async function fixture(tx: DbTransaction) {
  let [org] = await tx.select().from(s.organizations).limit(1);
  if (!org) [org] = await tx.insert(s.organizations).values({ name: "Private quote test organization" }).returning();
  const [actor] = await tx.insert(s.user).values({ id: fixtureIds.actor, name: "Quote tests", email: `${fixtureIds.actor}@example.test` }).returning();
  const [member] = await tx.insert(s.memberships).values({ id: fixtureIds.member, organizationId: org.id,
    userId: actor.id, role: "administrator" }).returning();
  const ctx: AccessContext = { userId: actor.id, organizationId: org.id, membershipId: member.id,
    sessionId: randomUUID(), name: actor.name, email: actor.email, role: "administrator" };
  const base = { orgId: org.id, createdBy: actor.id };
  await tx.insert(s.customers).values({ ...base, id: fixtureIds.customer, name: "Ñandú Cliente", contactPhone: "3001234567" });
  await tx.insert(s.filaments).values({ ...base, id: fixtureIds.filament, brand: "Fixture", model: "PLA", materialType: "PLA",
    color: "Oro", purchaseValue: "80000", rollWeightG: "1000" });
  await tx.insert(s.documentCounters).values([{ organizationId: org.id, kind: "COT", nextValue: 1_000_000n },
    { organizationId: org.id, kind: "PED", nextValue: 1_000_000n }]).onConflictDoUpdate({
      target: [s.documentCounters.organizationId, s.documentCounters.kind], set: { nextValue: 1_000_000n } });
  return ctx;
}

function input() {
  return { projectName: "Pieza española", customerId: fixtureIds.customer, description: "Acabado lijado y pintura",
    printSeconds: "5430", materials: [{ filamentId: fixtureIds.filament, grams: "100", pricePerGram: "80" }],
    postprocess: [], formula: defaultFormula, selectedLevel: "medium" as const, businessDate: "2026-10-02",
    customerNotes: "Entrega acordada", internalNotes: "PRIVATE_INTERNAL_SECRET", idempotencyKey: randomUUID() };
}

async function rolledBack(body: (tx: DbTransaction, ctx: AccessContext) => Promise<void>) {
  try {
    await db.transaction(async (tx) => { const ctx = await fixture(tx); activeContext = ctx; await body(tx, ctx); throw rollback; });
  } catch (error) { if (error !== rollback) throw error; }
}

beforeAll(async () => { await migrate(db, { migrationsFolder: "./drizzle" }); });
afterAll(async () => { await pool.end(); });

describe("real persisted quote contracts", () => {
  it("duplica para cambiar filamentos y elimina del listado sin alterar el pedido original",async()=>rolledBack(async(tx,ctx)=>{
    const {quoteId,orderId}=await confirmedOrder(tx,ctx);
    const [source]=await tx.select().from(s.quotes).where(eq(s.quotes.id,quoteId));
    const [revision]=await tx.select().from(s.quoteRevisions).where(eq(s.quoteRevisions.id,source.currentRevisionId!));
    const filamentId=randomUUID();
    await tx.insert(s.filaments).values({id:filamentId,orgId:ctx.organizationId,createdBy:ctx.userId,brand:"Copia",model:"PLA",materialType:"PLA",color:"Verde limón",purchaseValue:"70000",rollWeightG:"1000"});
    const copyId=(await executeQuoteCommand("quotes.duplicate",{quoteId,expectedVersion:3,idempotencyKey:randomUUID()},ctx,tx)).id;
    const changed={...input(),projectName:"Copia editable",materials:[{filamentId,grams:"25",pricePerGram:"70"}]};
    await executeQuoteCommand("quotes.updateDraft",{...changed,quoteId:copyId,expectedVersion:1},ctx,tx);
    const [copy]=await tx.select().from(s.quotes).where(eq(s.quotes.id,copyId));
    expect(copy.duplicatedFromId).toBe(quoteId);
    const [material]=await tx.select().from(s.quoteMaterials).where(eq(s.quoteMaterials.revisionId,copy.currentRevisionId!));
    expect(material.filamentId).toBe(filamentId);
    const [preserved]=await tx.select().from(s.quoteRevisions).where(eq(s.quoteRevisions.id,revision.id));
    expect(preserved).toEqual(revision);
    await executeQuoteCommand("quotes.archive",{quoteId,expectedVersion:3,idempotencyKey:randomUUID()},ctx,tx);
    const [archived]=await tx.select().from(s.quotes).where(eq(s.quotes.id,quoteId));
    expect(archived.archivedAt).toBeInstanceOf(Date);
    const [order]=await tx.select().from(s.orders).where(eq(s.orders.id,orderId));
    expect(order.sourceQuoteId).toBe(quoteId);
    expect(order.acceptedRevisionId).toBe(revision.id);
    expect(order.agreedPrice).toBe(revision.quotedPrice);
    await executeQuoteCommand("quotes.archive",{quoteId:copyId,expectedVersion:2,idempotencyKey:randomUUID()},ctx,tx);
    const events=await tx.select().from(s.auditEvents).where(and(eq(s.auditEvents.entityId,copyId),eq(s.auditEvents.action,"quotes.archive")));
    expect(events).toHaveLength(1);
  }));
  it("freezes published inputs, exact prices and filament snapshots after rate changes", async () => {
    await rolledBack(async (tx, ctx) => {
      const quote = await executeQuoteCommand("quotes.createDraft", input(), ctx, tx);
      const [before] = await tx.select().from(s.quoteRevisions).where(eq(s.quoteRevisions.quoteId, quote.id));
      expect(before.quotedPrice).toBe("30164");
      await executeQuoteCommand("quotes.publish", { quoteId: quote.id, expectedVersion: 1, idempotencyKey: randomUUID() }, ctx, tx);
      await tx.update(s.filaments).set({ purchaseValue: "160000" }).where(eq(s.filaments.id, fixtureIds.filament));
      const [after] = await tx.select().from(s.quoteRevisions).where(eq(s.quoteRevisions.id, before.id));
      const [line] = await tx.select().from(s.quoteMaterials).where(eq(s.quoteMaterials.revisionId, after.id));
      expect(after.formulaSnapshot).toEqual(before.formulaSnapshot);
      expect(after.estimatedCost).toBe(before.estimatedCost);
      expect(after.quotedPrice).toBe("30164"); expect(line.pricePerGram).toBe("80.000000");
      expect(after.status).toBe("sent");
    });
  });

  it("allocates max revision + 1 when revising historical revision", async () => {
    await rolledBack(async (tx, ctx) => {
      const quote = await executeQuoteCommand("quotes.createDraft", input(), ctx, tx);
      const [first] = await tx.select().from(s.quoteRevisions).where(eq(s.quoteRevisions.quoteId, quote.id));
      await executeQuoteCommand("quotes.publish", { quoteId: quote.id, expectedVersion: 1, idempotencyKey: randomUUID() }, ctx, tx);
      await executeQuoteCommand("quotes.revise", { ...input(), quoteId: quote.id, expectedVersion: 2, revisionId: first.id }, ctx, tx);
      await executeQuoteCommand("quotes.revise", { ...input(), quoteId: quote.id, expectedVersion: 3, revisionId: first.id }, ctx, tx);
      const history = await tx.select().from(s.quoteRevisions).where(eq(s.quoteRevisions.quoteId, quote.id));
      expect(history.map((r) => r.revisionNumber).sort()).toEqual([1, 2, 3]);
      expect(history.find((r) => r.id === first.id)?.status).toBe("sent");
    });
  });

  it("rejects nonexistent company in composite FK without resetting shared tables", async () => {
    await rolledBack(async (tx, ctx) => {
      await tx.execute(sql`SAVEPOINT bad_company`);
      await expect(tx.insert(s.quotes).values({ orgId: randomUUID(), customerId: fixtureIds.customer,
        createdBy: ctx.userId, sequenceNumber: 9n, code: "COT-FOREIGN" })).rejects.toThrow();
      await tx.execute(sql`ROLLBACK TO SAVEPOINT bad_company`);
      expect(await tx.select().from(s.customers).where(eq(s.customers.id, fixtureIds.customer))).toHaveLength(1);
    });
  });

  it("PDF renderer paginates Unicode and accepts only a commercial input type", async () => {
    const bytes = await renderCommercialQuote({ code: "COT-TEST", revisionNumber: 1, status: "draft", projectName: "Ñandú y fabricación 3D",
      customerName: "Cliente español", price: "30164", businessDate: "2026-10-02",
      description: "Texto comercial con áéíóú, ñ y una línea extensa. ".repeat(180), customerNotes: "Sólo observaciones comerciales." });
    const document = await PDFDocument.load(bytes);
    expect(document.getPageCount()).toBeGreaterThan(1);
    expect(document.getTitle()).toContain("COT-TEST");
  });

  it("private PDF handler builds a commercial DTO without internal notes or financial inputs", async () => {
    await rolledBack(async (tx, ctx) => {
      const created = await executeQuoteCommand("quotes.createDraft", input(), ctx, tx);
      const [revision] = await tx.select().from(s.quoteRevisions).where(eq(s.quoteRevisions.quoteId, created.id));
      pdfDb = tx;
      const render = vi.spyOn(pdfModule, "renderCommercialQuote").mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
      try {
        const { GET } = await import("../src/app/api/quotes/[quoteId]/revisions/[revisionId]/pdf/route");
        const response = await GET(new Request("http://localhost/api/quotes/private/pdf"), {
          params: Promise.resolve({ quoteId: created.id, revisionId: revision.id }),
        });
        expect(response.status).toBe(200);
        expect(response.headers.get("Cache-Control")).toBe("private, no-store");
        const commercial = render.mock.calls[0][0];
        expect(commercial.customerNotes).toBe("Entrega acordada");
        expect(commercial.price).toBe("30164");
        expect(commercial).not.toHaveProperty("internalNotes");
        expect(commercial).not.toHaveProperty("estimatedCost");
        expect(commercial).not.toHaveProperty("formulaSnapshot");
        expect(JSON.stringify(commercial)).not.toContain("PRIVATE_INTERNAL_SECRET");
      } finally { render.mockRestore(); pdfDb = db; }
    });
  });

  it("concurrent conversion commands return one order for the same source", async () => {
    // Commit this private fixture so independent connections can observe row locks.
    // Only its IDs are deleted afterwards; all other test data is preserved.
    let quoteId = "";
    let ctx!: AccessContext;
    const organizationsBefore = await db.select({ id: s.organizations.id }).from(s.organizations);
    const countersBefore = await db.select().from(s.documentCounters);
    await db.transaction(async (tx) => {
      ctx = await fixture(tx);
      quoteId = (await executeQuoteCommand("quotes.createDraft", input(), ctx, tx)).id;
      await executeQuoteCommand("quotes.publish", { quoteId, expectedVersion: 1, idempotencyKey: randomUUID() }, ctx, tx);
      await executeQuoteCommand("quotes.accept", { quoteId, expectedVersion: 2, idempotencyKey: randomUUID() }, ctx, tx);
    });
    try {
      const command = { quoteId, customerId: fixtureIds.customer, expectedVersion: 3 };
      const converted = await Promise.all([db.transaction((tx) => executeQuoteCommand("orders.convertQuote", { ...command, idempotencyKey: randomUUID() }, ctx, tx)),
        db.transaction((tx) => executeQuoteCommand("orders.convertQuote", { ...command, idempotencyKey: randomUUID() }, ctx, tx))]);
      expect(converted[0].id).toBe(converted[1].id);
      const created = await db.select().from(s.orders).where(eq(s.orders.sourceQuoteId, quoteId));
      expect(created).toHaveLength(1); expect(created[0].agreedPrice).toBe("30164");
    } finally {
      await db.transaction(async (tx) => {
        const orderRows = await tx.select({ id: s.orders.id }).from(s.orders).where(eq(s.orders.sourceQuoteId, quoteId));
        for (const row of orderRows) await tx.delete(s.orderStatusEvents).where(eq(s.orderStatusEvents.orderId, row.id));
        await tx.delete(s.orders).where(eq(s.orders.sourceQuoteId, quoteId));
        await tx.update(s.quotes).set({ currentRevisionId: null }).where(eq(s.quotes.id, quoteId));
        const revisions = await tx.select({ id: s.quoteRevisions.id }).from(s.quoteRevisions).where(eq(s.quoteRevisions.quoteId, quoteId));
        for (const r of revisions) {
          await tx.update(s.quoteRevisions).set({ selectedOptionId: null }).where(eq(s.quoteRevisions.id, r.id));
          await tx.delete(s.quoteMaterials).where(eq(s.quoteMaterials.revisionId, r.id));
          await tx.delete(s.quotePostprocesses).where(eq(s.quotePostprocesses.revisionId, r.id));
          await tx.delete(s.quotePriceOptions).where(eq(s.quotePriceOptions.revisionId, r.id));
        }
        await tx.delete(s.quoteRevisions).where(eq(s.quoteRevisions.quoteId, quoteId));
        await tx.delete(s.quotes).where(eq(s.quotes.id, quoteId));
        await tx.delete(s.customers).where(eq(s.customers.id, fixtureIds.customer));
        await tx.delete(s.filaments).where(eq(s.filaments.id, fixtureIds.filament));
        await tx.delete(s.auditEvents).where(and(eq(s.auditEvents.orgId, ctx.organizationId), eq(s.auditEvents.actorId, ctx.userId)));
        await tx.delete(s.memberships).where(eq(s.memberships.id, fixtureIds.member));
        await tx.delete(s.user).where(eq(s.user.id, fixtureIds.actor));
        for (const kind of ["COT", "PED"]) {
          const previous = countersBefore.find((c) => c.organizationId === ctx.organizationId && c.kind === kind);
          if (previous) await tx.update(s.documentCounters).set({ nextValue: previous.nextValue })
            .where(and(eq(s.documentCounters.organizationId, ctx.organizationId), eq(s.documentCounters.kind, kind)));
          else await tx.delete(s.documentCounters).where(and(eq(s.documentCounters.organizationId, ctx.organizationId), eq(s.documentCounters.kind, kind)));
        }
        if (!organizationsBefore.some((o) => o.id === ctx.organizationId)) {
          await tx.delete(s.organizations).where(eq(s.organizations.id, ctx.organizationId));
        }
      });
    }
  });
});
