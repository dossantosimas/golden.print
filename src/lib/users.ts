import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { and, asc, count, eq, gt, sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { AccessError, requireAccess, type AccessContext } from "@/lib/access";
import { getDb, type DbTransaction } from "@/lib/db";
import { account, auditEvents, memberships, mutationRequests, session, user } from "@/lib/db/schema";

const roleSchema = z.enum(["administrator", "operator"]);
const passwordSchema = z.string().min(12).max(128);
const keySchema = z.uuid();
const createSchema = z.object({
  name: z.string().trim().min(1).max(200), email: z.email().max(320).transform((v) => v.toLowerCase()),
  password: passwordSchema, role: roleSchema, idempotencyKey: keySchema,
}).strict();
const mutationSchema = z.object({
  targetUserId: z.uuid(), expectedVersion: z.number().int().positive(), idempotencyKey: keySchema,
}).strict();
const roleMutationSchema = mutationSchema.extend({ role: roleSchema });
const resetSchema = mutationSchema.extend({ password: passwordSchema });
const nameMutationSchema = mutationSchema.extend({ name: z.string().trim().min(1).max(200) });
export type CreateUserInput = z.input<typeof createSchema>;
export type UserMutationInput = z.input<typeof mutationSchema>;
export type ChangeRoleInput = z.input<typeof roleMutationSchema>;
export type ResetCredentialInput = z.input<typeof resetSchema>;
export type UpdateNameInput = z.input<typeof nameMutationSchema>;
export type UserSummary = { id: string; membershipId: string; name: string; email: string; role: string; active: boolean; version: number };

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new AccessError("VALIDATION_ERROR", "Revisa los campos de usuario y la contraseña (12–128 caracteres).");
  return result.data;
}

function inputHash(payload: unknown) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new AccessError("SERVICE_UNAVAILABLE", "Configuración de acceso incompleta.");
  // HMAC prevents dictionary attacks against persisted hashes of password inputs.
  return createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
}

async function lockAndReauthorize(tx: DbTransaction, ctx: AccessContext) {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended('golden-print-3d:access', 0))`);
  const [actor] = await tx.select({ id: memberships.id }).from(memberships)
    .innerJoin(session, eq(session.userId, memberships.userId))
    .where(and(eq(memberships.organizationId, ctx.organizationId), eq(memberships.userId, ctx.userId),
      eq(memberships.active, true), eq(memberships.role, "administrator"),
      eq(session.id, ctx.sessionId), gt(session.expiresAt, new Date()))).limit(1);
  if (!actor) throw new AccessError("FORBIDDEN", "Tu sesión o permiso de administrador ya no está vigente.");
}

async function summary(tx: DbTransaction, ctx: AccessContext, membershipId: string): Promise<UserSummary> {
  const [row] = await tx.select({ id: user.id, membershipId: memberships.id, name: user.name, email: user.email,
    role: memberships.role, active: memberships.active, version: memberships.version }).from(memberships)
    .innerJoin(user, eq(memberships.userId, user.id))
    .where(and(eq(memberships.organizationId, ctx.organizationId), eq(memberships.id, membershipId))).limit(1);
  if (!row) throw new AccessError("NOT_FOUND", "Usuario no encontrado.");
  return row;
}

async function replay(tx: DbTransaction, ctx: AccessContext, operation: string, key: string, hash: string) {
  const [previous] = await tx.select().from(mutationRequests).where(and(
    eq(mutationRequests.orgId, ctx.organizationId), eq(mutationRequests.actorId, ctx.userId),
    eq(mutationRequests.operation, operation), eq(mutationRequests.idempotencyKey, key))).limit(1);
  if (!previous) return null;
  if (previous.inputHash !== hash) throw new AccessError("IDEMPOTENCY_CONFLICT", "La clave de operación ya fue usada con datos diferentes.");
  return summary(tx, ctx, previous.resultEntityId);
}

async function record(tx: DbTransaction, ctx: AccessContext, operation: string, key: string, hash: string,
  result: UserSummary, metadata: Record<string, unknown>) {
  await tx.insert(auditEvents).values({ orgId: ctx.organizationId, actorId: ctx.userId,
    entityType: "membership", entityId: result.membershipId, action: operation, metadata });
  await tx.insert(mutationRequests).values({ orgId: ctx.organizationId, actorId: ctx.userId, operation,
    idempotencyKey: key, inputHash: hash, resultEntityType: "membership", resultEntityId: result.membershipId,
    resultStatus: "completed" });
}

export async function listUsers(): Promise<UserSummary[]> {
  const ctx = await requireAccess("administrator");
  return getDb().select({ id: user.id, membershipId: memberships.id, name: user.name, email: user.email,
    role: memberships.role, active: memberships.active, version: memberships.version }).from(memberships)
    .innerJoin(user, eq(memberships.userId, user.id)).where(eq(memberships.organizationId, ctx.organizationId))
    .orderBy(asc(user.name), asc(user.id)).limit(100);
}

export async function createUser(input: CreateUserInput): Promise<UserSummary> {
  const ctx = await requireAccess("administrator");
  const data = parse(createSchema, input);
  const hash = inputHash(data);
  const requestHeaders = await headers();
  let createdIdentity: string | undefined;
  try {
    return await getDb().transaction(async (tx) => {
      await lockAndReauthorize(tx, ctx);
      const previous = await replay(tx, ctx, "users.create", data.idempotencyKey, hash);
      if (previous) return previous;
      const [existing] = await tx.select({ id: user.id }).from(user).where(eq(user.email, data.email)).limit(1);
      if (existing) throw new AccessError("DEPENDENCY_CONFLICT", "Este correo ya tiene una identidad. Un administrador debe revisar su acceso.");
      // This API uses its own adapter connection. Identity creation is not part
      // of the business transaction; failed association is explicitly disabled.
      const created = await getAuth().api.createUser({ headers: requestHeaders,
        body: { name: data.name, email: data.email, password: data.password,
          role: data.role === "administrator" ? "admin" : "user" } });
      createdIdentity = created.user.id;
      const [member] = await tx.insert(memberships).values({ organizationId: ctx.organizationId,
        userId: created.user.id, role: data.role, active: true }).returning({ id: memberships.id });
      const result = await summary(tx, ctx, member.id);
      await record(tx, ctx, "users.create", data.idempotencyKey, hash, result, { role: data.role });
      return result;
    });
  } catch (error) {
    if (createdIdentity) {
      await getDb().transaction(async (tx) => {
        await tx.update(user).set({ banned: true, banReason: "Alta incompleta; requiere reparación administrativa.", updatedAt: new Date() })
          .where(eq(user.id, createdIdentity!));
        await tx.delete(session).where(eq(session.userId, createdIdentity!));
      }).catch(() => { /* No membership exists after rollback, so access remains denied. */ });
      throw new AccessError("SERVICE_UNAVAILABLE", "No se pudo completar el alta. La identidad quedó sin acceso; requiere revisión administrativa.");
    }
    if (error instanceof AccessError) throw error;
    throw new AccessError("SERVICE_UNAVAILABLE", "No se pudo crear el usuario. Revisa el servicio de acceso antes de reintentar.");
  }
}

type MutationKind = "changeRole" | "deactivate" | "reactivate" | "resetCredential" | "updateName";
async function mutateUser(kind: MutationKind, raw: unknown): Promise<UserSummary> {
  const ctx = await requireAccess("administrator");
  const data: UserMutationInput & { role?: "administrator" | "operator"; password?: string; name?: string } = kind === "changeRole" ? parse(roleMutationSchema, raw)
    : kind === "resetCredential" ? parse(resetSchema, raw) : kind === "updateName" ? parse(nameMutationSchema, raw) : parse(mutationSchema, raw);
  const hash = inputHash(data);
  const nextPassword = data.password ? await hashPassword(data.password) : undefined;
  const operation = `users.${kind}`;
  return getDb().transaction(async (tx) => {
    await lockAndReauthorize(tx, ctx);
    const previous = await replay(tx, ctx, operation, data.idempotencyKey, hash);
    if (previous) return previous;
    const [target] = await tx.select().from(memberships).where(and(
      eq(memberships.organizationId, ctx.organizationId), eq(memberships.userId, data.targetUserId))).for("update").limit(1);
    if (!target) throw new AccessError("NOT_FOUND", "Usuario no encontrado.");
    if (target.version !== data.expectedVersion) throw new AccessError("VERSION_CONFLICT", "El usuario cambió; recarga antes de editar.");
    const [previousIdentity] = kind === "updateName" ? await tx.select({ name: user.name }).from(user).where(eq(user.id, target.userId)) : [];
    const nextRole = data.role ?? target.role;
    const nextActive = kind === "deactivate" ? false : kind === "reactivate" ? true : target.active;
    if (target.active && target.role === "administrator" && (!nextActive || nextRole !== "administrator")) {
      const [total] = await tx.select({ value: count() }).from(memberships).where(and(
        eq(memberships.organizationId, ctx.organizationId), eq(memberships.role, "administrator"), eq(memberships.active, true)));
      if (total.value <= 1) throw new AccessError("LAST_ADMIN_REQUIRED", "Debe permanecer al menos un administrador activo.");
    }
    if (nextPassword) {
      const changed = await tx.update(account).set({ password: nextPassword, updatedAt: new Date() })
        .where(and(eq(account.userId, target.userId), eq(account.providerId, "credential"))).returning({ id: account.id });
      if (changed.length !== 1) throw new AccessError("DEPENDENCY_CONFLICT", "La identidad no tiene una credencial válida para recuperación.");
    }
    await tx.update(memberships).set({ role: nextRole, active: nextActive, version: target.version + 1, updatedAt: new Date() })
      .where(eq(memberships.id, target.id));
    if (kind === "updateName") await tx.update(user).set({ name: data.name!, updatedAt: new Date() }).where(eq(user.id, target.userId));
    else await tx.update(user).set({ role: nextRole === "administrator" ? "admin" : "user", banned: !nextActive,
      banReason: nextActive ? null : "Acceso desactivado por administrador.", banExpires: null, updatedAt: new Date() })
      .where(eq(user.id, target.userId));
    // Revocation and membership changes commit together, including password resets.
    if (kind !== "updateName") await tx.delete(session).where(eq(session.userId, target.userId));
    const result = await summary(tx, ctx, target.id);
    await record(tx, ctx, operation, data.idempotencyKey, hash, result,
      kind === "updateName" ? { previousName: previousIdentity?.name, name: result.name } : { previousRole: target.role, role: nextRole, previousActive: target.active, active: nextActive });
    return result;
  });
}

export const changeRole = (input: ChangeRoleInput) => mutateUser("changeRole", input);
export const deactivate = (input: UserMutationInput) => mutateUser("deactivate", input);
export const reactivate = (input: UserMutationInput) => mutateUser("reactivate", input);
export const resetCredential = (input: ResetCredentialInput) => mutateUser("resetCredential", input);
export const updateName = (input: UpdateNameInput) => mutateUser("updateName", input);
