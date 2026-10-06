import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { loadEnvFile } from "node:process";
import { randomUUID } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { writeFile } from "node:fs/promises";
import { Pool } from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { getDb, getPool } from "../src/lib/db";
import * as s from "../src/lib/db/schema";
import { getAuth } from "../src/lib/auth";
import { getWorkspaceData } from "../src/lib/app-service";

const requestContext = new AsyncLocalStorage<Headers>();
vi.mock("next/headers", () => ({ headers: async () => requestContext.getStore() ?? new Headers() }));
try { loadEnvFile(".env.local"); } catch { /* CI supplies environment. */ }
const source = process.env.TEST_DATABASE_URL;
if (!source || !new URL(source).pathname.endsWith("_test")) throw new Error("TEST_DATABASE_URL desechable es obligatoria.");
const target = new URL(source); target.pathname = "/golden_print_load_test";
process.env.DATABASE_URL = target.toString();
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.BETTER_AUTH_SECRET ??= "performance-test-only-secret-longer-than-32-characters";
let orgId: string;
const actorIds: string[] = [], cookies: Headers[] = [];
const password = "Performance-Test-Only-Password-123";

beforeAll(async () => {
  const adminUrl = new URL(source!); adminUrl.pathname = "/postgres";
  const admin = new Pool({ connectionString: adminUrl.toString() });
  try {
    const exists = await admin.query("select 1 from pg_database where datname=$1", ["golden_print_load_test"]);
    if (!exists.rowCount) await admin.query('CREATE DATABASE "golden_print_load_test"');
  } finally { await admin.end(); }
  const db = getDb();
  await migrate(db, { migrationsFolder: "./drizzle" });
  if ((await db.select().from(s.organizations).limit(1)).length) throw new Error("Load DB contiene una organización ajena; no se modifica.");
  orgId = randomUUID();
  await db.insert(s.organizations).values({ id: orgId, name: "Private performance fixtures" });
  const hash = await hashPassword(password);
  for (let i = 0; i < 10; i++) {
    const actorId = randomUUID(), email = `${actorId}@example.test`; actorIds.push(actorId);
    await db.insert(s.user).values({ id: actorId, name: `Performance ${i}`, email, role: "admin" });
    await db.insert(s.account).values({ id: randomUUID(), userId: actorId, accountId: actorId, providerId: "credential", password: hash });
    await db.insert(s.memberships).values({ organizationId: orgId, userId: actorId, role: "administrator" });
    const response = await getAuth().handler(new Request("http://localhost:3000/api/auth/sign-in/email", { method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost:3000", "x-forwarded-for": `127.0.1.${i + 1}` }, body: JSON.stringify({ email, password }) }));
    expect(response.status).toBe(200);
    cookies.push(new Headers({ cookie: response.headers.getSetCookie().map(v => v.split(";")[0]).join("; ") }));
  }
  const customerId = randomUUID();
  await db.insert(s.customers).values({ orgId, createdBy: actorIds[0], id: customerId, name: "Performance customer", contactPhone: "3000000000" });
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("CREATE TEMP TABLE load_fixture ON COMMIT DROP AS SELECT n, gen_random_uuid() quote_id, gen_random_uuid() revision_id, gen_random_uuid() order_id, gen_random_uuid() payment_id FROM generate_series(1,10000) n");
    await client.query('INSERT INTO quote(id,org_id,created_by,sequence_number,code,customer_id) SELECT quote_id,$1,$2,n,\'COT-LOAD-\'||n,$3 FROM load_fixture', [orgId, actorIds[0], customerId]);
    await client.query("INSERT INTO quote_revision(id,org_id,created_by,quote_id,revision_number,status,project_name,description,print_seconds,formula_snapshot,material_cost,energy_cost,machine_cost,contingency_cost,postprocess_cost,estimated_cost,quoted_price,business_date) SELECT revision_id,$1,$2,quote_id,1,'accepted','Load fixture','Load fixture',3600,'{}',400,0,0,0,0,400,1000,'2026-09-01' FROM load_fixture", [orgId, actorIds[0]]);
    await client.query("UPDATE quote SET current_revision_id=f.revision_id FROM load_fixture f WHERE quote.id=f.quote_id");
    await client.query("INSERT INTO \"order\"(id,org_id,created_by,sequence_number,code,customer_id,source_quote_id,accepted_revision_id,title,status,order_date,confirmed_at,delivered_at,agreed_price,cost_completeness) SELECT order_id,$1,$2,n,'PED-LOAD-'||n,$3,quote_id,revision_id,'Load fixture','delivered','2026-09-01','2026-08-01T12:00:00-05:00','2026-09-15T12:00:00-05:00',1000,'complete' FROM load_fixture", [orgId, actorIds[0], customerId]);
    await client.query("INSERT INTO direct_cost(org_id,created_by,order_id,category,economic_classification,cash_nature,description,incurred_date,amount) SELECT $1,$2,order_id,'material','variable','nonmonetary','Load consumption','2026-09-10',400 FROM load_fixture", [orgId, actorIds[0]]);
    await client.query("INSERT INTO payment(id,org_id,created_by,order_id,payment_date,amount,actor_id,idempotency_key) SELECT payment_id,$1,$2,order_id,'2026-09-15',500,$2,gen_random_uuid()::text FROM load_fixture", [orgId, actorIds[0]]);
    await client.query("INSERT INTO cash_movement(org_id,created_by,business_date,direction,amount,source_kind,payment_id,actor_id) SELECT $1,$2,'2026-09-15','in',500,'payment',payment_id,$2 FROM load_fixture", [orgId, actorIds[0]]);
    await client.query("COMMIT");
    for(const table of ["order","quote","payment","direct_cost","cash_movement","customer"])await client.query('ANALYZE "'+table+'"');
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}, 120000);

afterAll(async () => {
  try {
    if (orgId && actorIds.length) {
      await getDb().transaction(async tx => {
        for (const table of [s.cashMovements, s.payments, s.directCosts, s.orders]) await tx.delete(table).where(eq(table.orgId, orgId));
        await tx.update(s.quotes).set({ currentRevisionId: null }).where(eq(s.quotes.orgId, orgId));
        await tx.delete(s.quoteRevisions).where(eq(s.quoteRevisions.orgId, orgId));
        await tx.delete(s.quotes).where(eq(s.quotes.orgId, orgId));
        await tx.delete(s.customers).where(eq(s.customers.orgId, orgId));
        await tx.delete(s.memberships).where(eq(s.memberships.organizationId, orgId));
        await tx.delete(s.organizations).where(eq(s.organizations.id, orgId));
        for (const actorId of actorIds) await tx.delete(s.user).where(eq(s.user.id, actorId));
      });
    }
  } finally { await getPool().end(); }
}, 120000);

it("measures authenticated paginated orders and dashboard with 10000 rows / 10 sessions", async () => {
  const measurements: Record<string, { samplesMs: number[]; p95Ms: number }> = {};
  for (const entity of ["orders", "dashboard"]) {
    const samples: number[] = [];
    for (let wave = 0; wave < 3; wave++) {
      await Promise.all(cookies.map((headers, index) => requestContext.run(headers, async () => {
        const start = performance.now();
        const result = await getWorkspaceData(entity, "", entity === "dashboard" ? "2026-09-01:2026-09-30" : "", { page: index + 1, limit: 25 });
        samples.push(performance.now() - start);
        if (entity === "orders") { expect(result.total).toBe(10000); expect(result.items).toHaveLength(25); expect(result.pages).toBe(400); }
        else expect(result.metrics).toMatchObject({ sales: "10000000.000000", receipts: "5000000.000000", directCosts: "4000000.000000" });
      })));
    }
    const sorted = [...samples].sort((a, b) => a - b);
    measurements[entity] = { samplesMs: samples.map(v => Math.round(v)), p95Ms: Math.round(sorted[Math.ceil(sorted.length * 0.95) - 1]) };
  }
  const evidence = { runAt: new Date().toISOString(), node: process.version, database: "golden_print_load_test", orders: 10000,
    payments: 10000, directCosts: 10000, actualAuthenticatedSessions: cookies.length, concurrentRequests: 10, waves: 3,
    boundary: "Service + real Better Auth getSession + local PostgreSQL; request headers adapter; excludes HTTP/SSR/browser", measurements };
  await writeFile("docs/performance-results.json", JSON.stringify(evidence, null, 2) + "\n");
  console.info("Performance P95 milliseconds", Object.fromEntries(Object.entries(measurements).map(([k,v]) => [k,v.p95Ms])));
  // Record failure as evidence rather than quietly weakening the agreed target.
  expect(measurements.orders.p95Ms).toBeLessThanOrEqual(2000);
  expect(measurements.dashboard.p95Ms).toBeLessThanOrEqual(2000);
}, 180000);
