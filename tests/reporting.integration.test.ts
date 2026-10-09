import { beforeAll, beforeEach, afterEach, afterAll, describe, it, expect, vi } from "vitest";
import { loadEnvFile } from "node:process";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { eq } from "drizzle-orm";
import { getDb, getPool } from "../src/lib/db";
import * as s from "../src/lib/db/schema";
import { reportingData } from "../src/lib/reporting";
import { executeProductionCommand } from "../src/lib/production-service";
import type { AccessContext } from "../src/lib/access";
import {getEntityDetail,getWorkspaceData} from "../src/lib/app-service";
vi.mock("../src/lib/access",async importOriginal=>({...await importOriginal<typeof import("../src/lib/access")>(),requireAccess:async()=>ctx}));

try { loadEnvFile(".env.local"); } catch { /* CI supplies environment. */ }
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || !new URL(testUrl).pathname.endsWith("_test")) throw new Error("Se requiere TEST_DATABASE_URL desechable terminada en _test.");
const dedicatedUrl = new URL(testUrl);
dedicatedUrl.pathname = "/golden_print_reporting_test";
process.env.DATABASE_URL = dedicatedUrl.toString();
let ctx: AccessContext;
let customerId: string;
let sequence = 9000000n;
const period = "2026-09-01:2026-09-30";
const base = () => ({ orgId: ctx.organizationId, createdBy: ctx.userId });
const command = (name: string, input: Record<string, unknown>) => getDb().transaction(tx => executeProductionCommand(name, input, ctx, tx));

async function order(price = "1000", deliveredAt: Date | null = new Date("2026-09-15T12:00:00-05:00"), confirmedAt = new Date("2026-08-01T12:00:00-05:00"), productCost="0") {
  const db = getDb(), quoteId = randomUUID(), revisionId = randomUUID(), id = randomUUID();
  const n = sequence++;
  await db.insert(s.quotes).values({ ...base(), id: quoteId, sequenceNumber: n, code: `COT-${n}`, customerId });
  await db.insert(s.quoteRevisions).values({ ...base(), id: revisionId, quoteId, revisionNumber: 1, status: "accepted",
    projectName: "Reporting fixture", description: "Fixture", printSeconds: 0n, formulaSnapshot: {},
    materialCost: productCost, energyCost: "0", machineCost: "0", contingencyCost: "0", postprocessCost: "0", estimatedCost: productCost,
    quotedPrice: price, businessDate: "2026-09-01" });
  await db.update(s.quotes).set({ currentRevisionId: revisionId }).where(eq(s.quotes.id, quoteId));
  await db.insert(s.orders).values({ ...base(), id, sequenceNumber: n, code: `PED-${n}`, customerId, sourceQuoteId: quoteId,
    acceptedRevisionId: revisionId, title: "Reporting fixture", orderDate: "2026-09-01", agreedPrice: price,
    confirmedAt, deliveredAt, status: deliveredAt ? "delivered" : "not_started", costCompleteness: "complete" });
  return id;
}
const cost = (orderId: string, amount: string, extra: Record<string, unknown> = {}) => command("production.addCost", {
  orderId, category: "material", economicClassification: "variable", cashNature: "nonmonetary", description: "Fixture consumption",
  incurredDate: "2026-09-10", amount, ...extra,
});
const payment = (orderId: string, amount: string, paymentDate = "2026-09-15") => command("payments.create", { orderId, amount, paymentDate, idempotencyKey: randomUUID() });
const expense = (amount: string, classification = "opex", costBehavior: string | null = "fixed") => command("expenses.create", {
  expenseDate: "2026-09-10", description: "Fixture expense", category: "fixture", classification, amount,
  responsibleUserId: ctx.userId, ...(costBehavior ? { costBehavior } : {}),
});
async function report(actor = ctx) { return reportingData(actor, period); }

beforeAll(async () => {
  const adminUrl = new URL(testUrl!); adminUrl.pathname = "/postgres";
  const adminPool = new Pool({ connectionString: adminUrl.toString() });
  try {
    const existing = await adminPool.query("select 1 from pg_database where datname=$1", ["golden_print_reporting_test"]);
    if (!existing.rowCount) await adminPool.query('CREATE DATABASE "golden_print_reporting_test"');
  } finally { await adminPool.end(); }
  const db = getDb();
  await migrate(db, { migrationsFolder: "./drizzle" });
  const [existingOrg] = await db.select().from(s.organizations).limit(1);
  // Refuse to touch somebody else's data even in this dedicated test database.
  if (existingOrg) throw new Error("La base reporting_test contiene una organización: no se modifican datos ajenos.");
  const actorId = randomUUID(), orgId = randomUUID(), membershipId = randomUUID();
  await db.insert(s.user).values({ id: actorId, name: "Reporting fixture", email: `${actorId}@example.test` });
  await db.insert(s.organizations).values({ id: orgId, name: "Reporting integration fixtures" });
  await db.insert(s.memberships).values({ id: membershipId, organizationId: orgId, userId: actorId, role: "administrator" });
  ctx = { userId: actorId, organizationId: orgId, membershipId, sessionId: randomUUID(), role: "administrator", name: "Reporting fixture", email: `${actorId}@example.test` };
});
beforeEach(async () => {
  customerId = randomUUID();
  await getDb().insert(s.customers).values({ ...base(), id: customerId, name: "Reporting customer", contactPhone: "3000000000" });
});
afterEach(async () => {
  if (!ctx) return;
  await getDb().transaction(async tx => {
    // Delete only rows created by this suite's random actor; preserve migrations and other databases.
    for (const table of [s.cashMovements, s.payments, s.directCosts, s.productionAttempts, s.expenses, s.independentLosses]) {
      await tx.delete(table).where(eq(table.createdBy, ctx.userId));
    }
    await tx.delete(s.orderStatusEvents).where(eq(s.orderStatusEvents.actorId, ctx.userId));
    await tx.delete(s.orders).where(eq(s.orders.createdBy, ctx.userId));
    await tx.update(s.quotes).set({ currentRevisionId: null }).where(eq(s.quotes.createdBy, ctx.userId));
    await tx.delete(s.quoteRevisions).where(eq(s.quoteRevisions.createdBy, ctx.userId));
    await tx.delete(s.quotes).where(eq(s.quotes.createdBy, ctx.userId));
    await tx.delete(s.customers).where(eq(s.customers.createdBy, ctx.userId));
    await tx.delete(s.filaments).where(eq(s.filaments.createdBy, ctx.userId));
    await tx.delete(s.auditEvents).where(eq(s.auditEvents.actorId, ctx.userId));
  });
});
afterAll(async () => {
  try {
    if (ctx) {
      await getDb().delete(s.memberships).where(eq(s.memberships.id, ctx.membershipId));
      await getDb().delete(s.organizations).where(eq(s.organizations.id, ctx.organizationId));
      await getDb().delete(s.user).where(eq(s.user.id, ctx.userId));
    }
  } finally { await getPool().end(); }
});

describe("real PostgreSQL reporting financial oracles", () => {
  it("expense directory applies dates before totals and keeps category/search filters out of period metrics",async()=>{
   await expense("100");await expense("200","opex","variable");await expense("300","material_purchase",null);
   await command("expenses.create",{expenseDate:"2026-08-31",description:"Outside",classification:"opex",costBehavior:"fixed",category:"old",amount:"900",responsibleUserId:ctx.userId});
   await command("expenses.create",{expenseDate:"2026-09-12",description:"Voided",classification:"opex",costBehavior:"fixed",category:"old",amount:"800",responsibleUserId:ctx.userId});
   await getDb().update(s.expenses).set({voidedAt:new Date(),voidReason:"Fixture"}).where(eq(s.expenses.description,"Voided"));
   const list=await getWorkspaceData("expenses","","",{start:"2026-09-01",end:"2026-09-30",sort:"amount_asc"});
   expect(list.total).toBe(3);expect(list.items.map(i=>i.amount)).toEqual(["100","200","300"]);
   expect(list.items[0].responsibleName).toBe("Reporting fixture");
   expect(list.metrics).toMatchObject({periodCount:3,totalExpenses:"600",fixedExpenses:"100",variableExpenses:"200",materialPurchases:"300",dailyAverage:"20.000000",periodDays:30,categories:["fixture"]});
   const filtered=await getWorkspaceData("expenses","Reporting fixture","fixture",{start:"2026-09-01",end:"2026-09-30"});expect(filtered.total).toBe(3);expect(filtered.metrics).toEqual(list.metrics);
   const missing=await getWorkspaceData("expenses","not found","",{start:"2026-09-01",end:"2026-09-30"});expect(missing.total).toBe(0);expect(missing.metrics).toEqual(list.metrics);
  });
  it("filament catalog filters and sorts by unit cost while keeping unfiltered metrics",async()=>{
   const rows=[{brand:"Budget",model:"Basic",materialType:"PLA",color:"Azul",purchaseValue:"100",rollWeightG:"100"},{brand:"Premium",model:"Flex",materialType:"TPU",color:"Negro",purchaseValue:"150",rollWeightG:"50"}];
   await getDb().insert(s.filaments).values(rows.map(f=>({...base(),...f})));
   const list=await getWorkspaceData("filaments","","",{sort:"unit_asc"});
   expect(list.items.map(f=>f.brand)).toEqual(["Budget","Premium"]);
   expect(list.metrics).toMatchObject({catalogCount:2,registeredWeight:"150.000000",averageUnitCost:"2.000000",minimumUnitCost:"1.000000",maximumUnitCost:"3.000000",materialTypes:["PLA","TPU"]});
   expect((await getWorkspaceData("filaments","","",{sort:"unit_desc"})).items[0].brand).toBe("Premium");
   const filtered=await getWorkspaceData("filaments","","TPU");expect(filtered.total).toBe(1);expect(filtered.items[0].brand).toBe("Premium");expect(filtered.metrics).toEqual(list.metrics);
   expect((await getWorkspaceData("filaments","Azul")).items[0].brand).toBe("Budget");
  });
  it("customer directory counts actual activity and keeps global metrics when searching",async()=>{
    const delivered=await order("1000"),active=await order("500",null);
    await payment(delivered,"1000");
    await command("orders.close",{orderId:delivered,expectedVersion:1,confirmClose:true});
    const [pending]=await getDb().select().from(s.orders).where(eq(s.orders.id,active));
    await getDb().update(s.quoteRevisions).set({status:"sent"}).where(eq(s.quoteRevisions.id,pending.acceptedRevisionId!));
    const second=randomUUID();await getDb().insert(s.customers).values({...base(),id:second,name:"Another customer",contactPhone:"3111111111"});
    const full=await getWorkspaceData("customers","","",{sort:"orders"});
    expect(full.metrics).toMatchObject({customers:2,withActiveOrders:1,pendingQuotes:1,averageTicket:"1000.000000"});
    expect(full.items[0]).toMatchObject({id:customerId,orderCount:2,activeOrders:1,pendingQuotes:1});
    const searched=await getWorkspaceData("customers","3111111111");
    expect(searched.total).toBe(1);expect(searched.items[0].id).toBe(second);
    expect(searched.metrics).toEqual(full.metrics);
  });
  it("filters recent orders by period before limiting the dashboard rows", async () => {
    const inside = await order();
    const outside = await order();
    await getDb().update(s.orders).set({orderDate:"2026-10-01"}).where(eq(s.orders.id,outside));
    const data = await getWorkspaceData("orders","","",{limit:1,start:"2026-09-01",end:"2026-09-30"});
    expect(data.total).toBe(1);
    expect(data.items[0].id).toBe(inside);
  });
  it("keeps closed orders in delivered sales and excludes them from active work", async () => {
    const id = await order("1000",undefined,undefined,"200");
    await payment(id, "1000");
    await command("orders.close", { orderId: id, expectedVersion: 1, confirmClose: true });
    const data = await report();
    const metrics = data.metrics as Record<string, unknown>;
    expect(metrics.closed).toBe(1);
    expect(metrics.sales).toBe("1000.000000");
    expect(metrics.grossProfit).toBe("800.000000");
    const list = await getWorkspaceData("orders", "", "closed");
    expect(list.items).toHaveLength(1);
    expect(list.metrics?.active).toBe(0);
    expect(list.metrics?.activeValue).toBe("0");
  });
  it("summarizes all unarchived orders independently of list filters and pagination",async()=>{
    const delivered=await order("1000"),ready=await order("2000",null),printing=await order("5000",null),archived=await order("3000",null);
    await getDb().update(s.orders).set({status:"finished"}).where(eq(s.orders.id,ready));
    await getDb().update(s.orders).set({status:"printing"}).where(eq(s.orders.id,printing));
    const n=sequence++;
    await getDb().insert(s.orders).values({...base(),sequenceNumber:n,code:`PED-${n}`,customerId,title:"Intake",orderDate:"2026-09-01"});
    await payment(delivered,"400");await payment(ready,"500");await payment(printing,"1000");await payment(archived,"100");
    await getDb().update(s.orders).set({archivedAt:new Date()}).where(eq(s.orders.id,archived));
    const result=await getWorkspaceData("orders","","printing",{limit:1,page:1});
    expect(result.total).toBe(1);expect(result.items[0].id).toBe(printing);
    expect(result.metrics).toMatchObject({active:3,printing:1,finished:1,activeValue:"7000",balance:"6100"});
  });
  it("uses delivered cohort receipts, effective cash and failed costs without a second loss", async () => {
    const delivered = await order("1000",undefined,undefined,"300"), pending = await order("500", null,undefined,"400");
    const [failed] = await getDb().insert(s.productionAttempts).values({ ...base(), orderId: delivered, attemptNumber: 1,
      status: "failed", startedAt: new Date("2026-09-08T12:00:00Z"), completedAt: new Date("2026-09-08T13:00:00Z"),
      actualSeconds: 3600n, failureReason: "Fixture failure" }).returning();
    await cost(delivered, "100", { attemptId: failed.id }); await cost(delivered, "200"); await cost(pending, "400");
    await payment(delivered, "300", "2026-08-15"); await payment(delivered, "200"); await payment(pending, "200");
    await expense("50"); await expense("8000", "material_purchase", null);
    await command("losses.create", { recognizedDate: "2026-09-20", category: "fixture", description: "Independent fixture", amount: "100" });
    const result = await report();
    expect(result.metrics).toMatchObject({ sales: "1000.000000", directCosts: "300.000000", failedCosts: "100.000000",
      grossProfit: "700.000000", netProfit: "550.000000", opex: "50.000000", receipts: "400.000000",
      cohortReceipts: "500.000000", collectionRate: "50.000000", receivables: "800.000000",
      cashIn: "400.000000", cashOut: "8050.000000", cashNet: "-7650.000000", provisional: false });
  });
  it("puts independent losses in contribution, giving approved break-even 400", async () => {
    await order("1000",undefined,undefined,"400"); await expense("200");
    await command("losses.create", { recognizedDate: "2026-09-20", category: "fixture", description: "Loss", amount: "100" });
    expect((await report()).metrics).toMatchObject({ sales: "1000.000000", netProfit: "300.000000", breakEven: "400.000000", breakEvenProgress: "250.000000" });
  });
  it("shows current accumulated cash independently of the selected period and excludes voided or future cash",async()=>{
    const id=await order("1000");
    await payment(id,"300","2026-08-15");
    await payment(id,"200","2026-09-15");
    await expense("50");
    const future=await expense("100");
    await getDb().update(s.cashMovements).set({businessDate:"2099-01-01"}).where(eq(s.cashMovements.expenseId,String(future.id)));
    const first=await report();
    expect(first.metrics).toMatchObject({cashIn:"200.000000",cashOut:"50.000000",cashNet:"150.000000",cashTotalIn:"500.000000",cashTotalOut:"50.000000",cashBalance:"450.000000"});
    const other=await reportingData(ctx,"2026-09-16:2026-09-30");
    expect(other.metrics).toMatchObject({cashNet:"0.000000",cashBalance:"450.000000"});
    const [paid]=await getDb().select().from(s.payments).where(eq(s.payments.orderId,id));
    await command("payments.correct",{paymentId:paid.id,reason:"Registro falso"});
    const after=await report();
    expect(after.metrics).toMatchObject({cashTotalIn:paid.amount==="300"?"200.000000":"300.000000",cashBalance:paid.amount==="300"?"150.000000":"250.000000"});
    expect((await report({...ctx,role:"operator"})).metrics).not.toHaveProperty("cashBalance");
  });
  it("uses Bogota boundaries and excludes later confirmed receivables in ranking", async () => {
    await order("100", new Date("2026-09-01T04:59:59Z"));
    await order("200", new Date("2026-09-01T05:00:00Z"));
    await order("300", new Date("2026-10-01T04:59:59Z"));
    await order("400", new Date("2026-10-01T05:00:00Z"));
    await order("900", null, new Date("2026-10-02T12:00:00Z"));
    const result = await report();
    expect(result.metrics).toMatchObject({ sales: "500.000000", receivables: "1000.000000" });
    expect(result.items.find(row => row.id === customerId)).toMatchObject({ orderCount: 4, balance: "1000.000000", totalSales: "500.000000" });
  });
  it("uses quotation cost even when legacy cost records are corrected", async () => {
    const delivered = await order("1000",undefined,undefined,"200"); const initial = await cost(delivered, "100");
    await command("production.correctCost", { costId: initial.id, expectedVersion: 1, reason: "Fixture correction", replacement: {
      orderId: delivered, category: "material", economicClassification: "variable", cashNature: "nonmonetary", description: "Corrected",
      incurredDate: "2026-09-10", amount: "120",
    } });
    expect((await report()).metrics).toMatchObject({ directCosts: "200.000000", grossProfit: "800.000000", cashOut: "0.000000" });
  });
  it("uses quotation cost without separate records or confirmation and protects financial access", async () => {
    const delivered = await order("1000",undefined,undefined,"200");
    await getDb().update(s.orders).set({ costCompleteness: "incomplete" }).where(eq(s.orders.id, delivered));
    expect((await report()).metrics).toMatchObject({ directCosts:"200.000000",grossProfit:"800.000000",provisional:false });
    const list=await getWorkspaceData("orders"),detail=await getEntityDetail("orders",delivered);
    expect(list.items[0].actualCost).toBe("200.000000");expect(detail.item.actualCost).toBe("200.000000");
    expect(await getDb().select().from(s.directCosts)).toHaveLength(0);
    const operator = await report({ ...ctx, role: "operator" });
    expect(operator.metrics).not.toHaveProperty("sales");
    expect(operator).not.toHaveProperty("cashMovements");
    expect(operator.items).toEqual([]);
  });
  it("uses an explicit product cost adjustment consistently without inventing cash",async()=>{
    const id=await order("1000",undefined,undefined,"200");
    await getDb().update(s.orders).set({estimatedCostOverride:"350"}).where(eq(s.orders.id,id));
    expect((await getEntityDetail("orders",id)).item.actualCost).toBe("350.000000");
    expect((await getWorkspaceData("orders")).items[0].actualCost).toBe("350.000000");
    expect((await report()).metrics).toMatchObject({directCosts:"350.000000",grossProfit:"650.000000",cashOut:"0.000000"});
  });
  it("does not invent a target without sales or with nonpositive contribution", async () => {
    expect((await report()).metrics).toMatchObject({ sales: "0.000000", breakEven: null, breakEvenProgress: null });
    await order("100",undefined,undefined,"120"); await expense("10");
    expect((await report()).metrics).toMatchObject({ netProfit: "-30.000000", breakEven: null, breakEvenProgress: null });
  });
  it("excludes removed orders from operational counts, sales and product costs", async () => {
    const delivered = await order("1000",undefined,undefined,"400");
    await getDb().update(s.orders).set({ archivedAt: new Date() }).where(eq(s.orders.id, delivered));
    expect((await report()).metrics).toMatchObject({ totalOrders:0, sales: "0.000000", directCosts: "0.000000", breakEven: null, breakEvenProgress: null });
  });
});
