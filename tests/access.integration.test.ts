import { beforeAll, beforeEach, afterEach, afterAll, describe, it, expect, vi } from "vitest";
import { loadEnvFile } from "node:process";
import { randomUUID } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { Pool } from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { and, eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { getDb, getPool } from "../src/lib/db";
import * as s from "../src/lib/db/schema";
import { getAuth } from "../src/lib/auth";
import { requireAccess, type AccessContext } from "../src/lib/access";
import { mutate } from "../src/lib/mutations";
import { deactivate, changeRole, resetCredential, updateName } from "../src/lib/users";

// Adapt request context only; authentication, sessions and business logic are real.
const requestContext = new AsyncLocalStorage<Headers>();
vi.mock("next/headers", () => ({ headers: async () => requestContext.getStore() ?? new Headers() }));
try { loadEnvFile(".env.local"); } catch { /* CI provides environment. */ }
const sourceUrl = process.env.TEST_DATABASE_URL;
if (!sourceUrl || !new URL(sourceUrl).pathname.endsWith("_test")) throw new Error("Se requiere TEST_DATABASE_URL desechable.");
const dedicated = new URL(sourceUrl); dedicated.pathname = "/golden_print_access_test";
process.env.DATABASE_URL = dedicated.toString();
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.BETTER_AUTH_SECRET ??= "access-test-only-secret-with-more-than-32-characters";
const password = "Integration-Only-Password-123";
const newPassword = "Integration-Changed-Password-456";
let organizationId: string;
let actor: AccessContext, other: AccessContext, actorHeaders: Headers, otherHeaders: Headers;
let userIds: string[] = [];
let fixtureSequence = 0;
const within = <T>(headers: Headers, body: () => Promise<T>) => requestContext.run(headers, body);

async function fixture(role: "administrator" | "operator") {
  const userId = randomUUID(), membershipId = randomUUID(), email = `${userId}@example.test`;
  userIds.push(userId);
  await getDb().insert(s.user).values({ id: userId, email, name: "Access fixture", role: role === "administrator" ? "admin" : "user" });
  await getDb().insert(s.account).values({ id: randomUUID(), accountId: userId, userId, providerId: "credential", password: await hashPassword(password) });
  await getDb().insert(s.memberships).values({ id: membershipId, organizationId, userId, role });
  const response = await getAuth().handler(new Request("http://localhost:3000/api/auth/sign-in/email", {
    method: "POST", headers: { "content-type": "application/json", origin: "http://localhost:3000", "x-forwarded-for": `127.0.0.${++fixtureSequence}` },
    body: JSON.stringify({ email, password }),
  }));
  expect(response.status).toBe(200);
  const cookie = response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  const headers = new Headers({ cookie });
  const ctx = await within(headers, () => requireAccess());
  return { ctx, headers };
}
beforeAll(async () => {
  const adminUrl = new URL(sourceUrl!); adminUrl.pathname = "/postgres";
  const pool = new Pool({ connectionString: adminUrl.toString() });
  try {
    const exists = await pool.query("select 1 from pg_database where datname=$1", ["golden_print_access_test"]);
    if (!exists.rowCount) await pool.query('CREATE DATABASE "golden_print_access_test"');
  } finally { await pool.end(); }
  await migrate(getDb(), { migrationsFolder: "./drizzle" });
  if ((await getDb().select().from(s.organizations).limit(1)).length) throw new Error("Access test DB contiene una organización ajena; no se modifica.");
  organizationId = randomUUID();
  await getDb().insert(s.organizations).values({ id: organizationId, name: "Access test private fixtures" });
});
beforeEach(async () => {
  // Reset fixture-only login quotas in this dedicated disposable database.
  await getDb().delete(s.rateLimit);
  userIds = [];
  const adminFixture = await fixture("administrator"); actor = adminFixture.ctx; actorHeaders = adminFixture.headers;
  const otherFixture = await fixture("operator"); other = otherFixture.ctx; otherHeaders = otherFixture.headers;
});
afterEach(async () => {
  for (const userId of userIds) {
    await getDb().delete(s.mutationRequests).where(eq(s.mutationRequests.actorId, userId));
    await getDb().delete(s.auditEvents).where(eq(s.auditEvents.actorId, userId));
    await getDb().delete(s.customers).where(eq(s.customers.createdBy, userId));
    await getDb().delete(s.memberships).where(eq(s.memberships.userId, userId));
    await getDb().delete(s.user).where(eq(s.user.id, userId));
  }
});
afterAll(async () => {
  try { if (organizationId) await getDb().delete(s.organizations).where(eq(s.organizations.id, organizationId)); }
  finally { await getPool().end(); }
});

describe("real auth session and access transaction guards", () => {
  it("revoked session prevents effects and replay from a stale access context", async () => {
    const input = { idempotencyKey: randomUUID(), name: "Before revocation" }, id = randomUUID();
    let runs = 0;
    const handler = async () => { runs++; return { id, entityType: "customer" }; };
    await mutate("customers.test", input, other, handler);
    await getDb().delete(s.session).where(eq(s.session.id, other.sessionId));
    await expect(mutate("customers.test", input, other, handler)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    await expect(mutate("customers.test", { ...input, idempotencyKey: randomUUID() }, other, handler)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect(runs).toBe(1);
  });
  it("updates names with authorization, audit, idempotency and preserved sessions", async () => {
    const input = { targetUserId: actor.userId, expectedVersion: 1, name: "  Nuevo nombre  ", idempotencyKey: randomUUID() };
    await expect(within(otherHeaders, () => updateName(input))).rejects.toMatchObject({code:"FORBIDDEN"});
    await expect(within(actorHeaders, () => updateName({...input,name:"  "}))).rejects.toMatchObject({code:"VALIDATION_ERROR"});
    const result = await within(actorHeaders, () => updateName(input));
    expect(result).toMatchObject({name:"Nuevo nombre",role:"administrator",active:true,version:2});
    expect(await within(actorHeaders, () => updateName(input))).toEqual(result);
    await expect(within(actorHeaders, () => updateName({...input,name:"Otro",idempotencyKey:randomUUID()}))).rejects.toMatchObject({code:"VERSION_CONFLICT"});
    expect(await getDb().select().from(s.session).where(eq(s.session.id,actor.sessionId))).toHaveLength(1);
    expect(await within(actorHeaders, () => requireAccess("administrator"))).toMatchObject({name:"Nuevo nombre",userId:actor.userId});
    const audits = await getDb().select().from(s.auditEvents).where(and(eq(s.auditEvents.actorId,actor.userId),eq(s.auditEvents.action,"users.updateName")));
    expect(audits).toHaveLength(1);expect(audits[0].metadata).toMatchObject({previousName:"Access fixture",name:"Nuevo nombre"});
  });
  it("preserves the last administrator on deactivation and demotion", async () => {
    await expect(within(actorHeaders, () => deactivate({ targetUserId: actor.userId, expectedVersion: 1, idempotencyKey: randomUUID() }))).rejects.toMatchObject({ code: "LAST_ADMIN_REQUIRED" });
    await expect(within(actorHeaders, () => changeRole({ targetUserId: actor.userId, expectedVersion: 1, role: "operator", idempotencyKey: randomUUID() }))).rejects.toMatchObject({ code: "LAST_ADMIN_REQUIRED" });
    const [member] = await getDb().select().from(s.memberships).where(eq(s.memberships.id, actor.membershipId));
    expect(member).toMatchObject({ active: true, role: "administrator", version: 1 });
    expect((await within(actorHeaders, () => requireAccess("administrator"))).userId).toBe(actor.userId);
  });
  it("deactivation revokes target sessions and denies old cookie immediately", async () => {
    await within(actorHeaders, () => deactivate({ targetUserId: other.userId, expectedVersion: 1, idempotencyKey: randomUUID() }));
    expect(await getDb().select().from(s.session).where(eq(s.session.userId, other.userId))).toHaveLength(0);
    await expect(within(otherHeaders, () => requireAccess())).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    await expect(mutate("customers.test", { idempotencyKey: randomUUID() }, other, async () => ({ id: randomUUID() }))).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("credential reset hashes new password and revokes all target sessions atomically", async () => {
    await within(actorHeaders, () => resetCredential({ targetUserId: other.userId, expectedVersion: 1, password: newPassword, idempotencyKey: randomUUID() }));
    const [credential] = await getDb().select().from(s.account).where(and(eq(s.account.userId, other.userId), eq(s.account.providerId, "credential")));
    expect(await verifyPassword({ hash: credential.password!, password: newPassword })).toBe(true);
    expect(await verifyPassword({ hash: credential.password!, password })).toBe(false);
    expect(await getDb().select().from(s.session).where(eq(s.session.userId, other.userId))).toHaveLength(0);
    await expect(mutate("customers.test", { idempotencyKey: randomUUID() }, other, async () => ({ id: randomUUID() }))).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });
  it("idempotent concurrent requests execute one effect and conflicting input is rejected", async () => {
    const id = randomUUID(), input = { idempotencyKey: randomUUID(), name: "Only once" };
    const handler = async (tx: Parameters<Parameters<typeof mutate>[3]>[0]) => {
      await tx.insert(s.customers).values({ id, orgId: organizationId, createdBy: other.userId, name: input.name, contactPhone: "3000000000" });
      return { id, entityType: "customer" };
    };
    const outcomes = await Promise.all([mutate("customers.test", input, other, handler), mutate("customers.test", input, other, handler)]);
    expect(outcomes.map(row => row.id)).toEqual([id, id]);
    expect(await getDb().select().from(s.customers).where(eq(s.customers.id, id))).toHaveLength(1);
    await expect(mutate("customers.test", { ...input, name: "Changed" }, other, handler)).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  });
});
