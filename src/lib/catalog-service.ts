import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { AccessError, type AccessContext } from "./access";
import type { DbTransaction } from "./db";
import { auditEvents, businessSettings, customers, filaments, orders, quotes } from "./db/schema";
import { D, formulaSchema } from "./finance";

const key = z.object({ idempotencyKey: z.uuid() });
const edit = key.extend({ id: z.uuid(), expectedVersion: z.coerce.number().int().positive() });
const text = z.string().trim().min(1).max(200);
const optionalText = z.string().max(5000).optional();
const decimal = z.string().regex(/^(0|[1-9]\d{0,11})(\.\d{1,6})?$/);
const customerFields = z.object({ name: text, contactPhone: z.string().trim().min(1).max(100),
  email: z.email().max(320).optional(), socialHandle: z.string().max(200).optional(), address: optionalText, notes: optionalText });
const filamentFields = z.object({ brand: text, model: text, materialType: text, color: text,
  purchaseValue: decimal, rollWeightG: decimal.refine((v) => new D(v).gt(0)) });

async function audit(tx: DbTransaction, ctx: AccessContext, action: string, id: string) {
  await tx.insert(auditEvents).values({ orgId: ctx.organizationId, actorId: ctx.userId,
    action, entityType: action.split(".")[0], entityId: id, metadata: {} });
}

export async function executeCatalogCommand(command: string, raw: Record<string, unknown>, ctx: AccessContext, tx: DbTransaction) {
  const [entity, operation] = command.split(".");
  if (entity === "settings") {
    if (ctx.role !== "administrator") throw new AccessError("FORBIDDEN", "Solo el administrador puede editar la fórmula.");
    if (operation !== "update") throw new AccessError("VALIDATION_ERROR", "Operación de configuración inválida.");
    const data = key.extend({ expectedVersion: z.coerce.number().int().positive(), formula: formulaSchema }).strict().parse(raw);
    const [current] = await tx.select().from(businessSettings).where(eq(businessSettings.organizationId, ctx.organizationId)).for("update");
    if (!current) throw new AccessError("NOT_FOUND", "Configuración no encontrada.");
    if (current.version !== data.expectedVersion) throw new AccessError("VERSION_CONFLICT", "La fórmula cambió; recarga antes de editar.");
    await tx.update(businessSettings).set({ formulaVersion: current.formulaVersion + 1, version: current.version + 1,
      powerKw: data.formula.powerKw, energyKwhRate: data.formula.energyRate, machineHourRate: data.formula.machineRate,
      contingencyRate: data.formula.contingencyRate, minimumMultiplier: data.formula.multipliers[0],
      mediumMultiplier: data.formula.multipliers[1], highMultiplier: data.formula.multipliers[2], updatedBy: ctx.userId, updatedAt: new Date() })
      .where(eq(businessSettings.organizationId, ctx.organizationId));
    await audit(tx, ctx, command, ctx.organizationId);
    return { id: ctx.organizationId, entityType: "settings" };
  }
  if (entity !== "customers" && entity !== "filaments") throw new AccessError("VALIDATION_ERROR", "Catálogo inválido.");
  if (operation === "create") {
    let id: string;
    if (entity === "customers") {
      const { idempotencyKey: _key, ...data } = customerFields.extend(key.shape).strict().parse(raw);
      const [row] = await tx.insert(customers).values({ ...data, orgId: ctx.organizationId, createdBy: ctx.userId }).returning({ id: customers.id });
      id = row.id;
    } else {
      const { idempotencyKey: _key, ...data } = filamentFields.extend(key.shape).strict().parse(raw);
      const [row] = await tx.insert(filaments).values({ ...data, orgId: ctx.organizationId, createdBy: ctx.userId }).returning({ id: filaments.id });
      id = row.id;
    }
    await audit(tx, ctx, command, id);
    return { id, entityType: entity };
  }
  const table = entity === "customers" ? customers : filaments;
  const base = edit.parse(raw);
  const [current] = await tx.select({ id: table.id, version: table.version }).from(table)
    .where(and(eq(table.orgId, ctx.organizationId), eq(table.id, base.id))).for("update");
  if (!current) throw new AccessError("NOT_FOUND", "Registro no encontrado.");
  if (current.version !== base.expectedVersion) throw new AccessError("VERSION_CONFLICT", "El registro cambió; recarga antes de editar.");
  if (operation === "update") {
    if (entity === "customers") {
      const { id: _id, expectedVersion: _version, idempotencyKey: _key, ...data } = customerFields.extend(edit.shape).strict().parse(raw);
      await tx.update(customers).set({ ...data, version: current.version + 1, updatedAt: new Date() }).where(eq(customers.id, base.id));
    } else {
      const { id: _id, expectedVersion: _version, idempotencyKey: _key, ...data } = filamentFields.extend(edit.shape).strict().parse(raw);
      await tx.update(filaments).set({ ...data, version: current.version + 1, updatedAt: new Date() }).where(eq(filaments.id, base.id));
    }
  } else if (operation === "archive") {
    edit.strict().parse(raw);
    await tx.update(table).set({ archivedAt: new Date(), updatedAt: new Date(), version: current.version + 1 }).where(eq(table.id, base.id));
  } else if (operation === "deleteUnused") {
    edit.strict().parse(raw);
    if (entity === "customers") {
      const refs = await tx.select({ id: quotes.id }).from(quotes).where(eq(quotes.customerId, base.id)).limit(1);
      const refs2 = await tx.select({ id: orders.id }).from(orders).where(eq(orders.customerId, base.id)).limit(1);
      if (refs.length || refs2.length) throw new AccessError("DEPENDENCY_CONFLICT", "El cliente tiene historial. Archívalo para conservarlo.");
    }
    // Filament foreign keys also reject deletion when it is used by a snapshot or cost.
    await tx.delete(table).where(eq(table.id, base.id));
  } else throw new AccessError("VALIDATION_ERROR", "Operación de catálogo inválida.");
  await audit(tx, ctx, command, base.id);
  return { id: base.id, entityType: entity };
}
