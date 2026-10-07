import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, isNull, max } from "drizzle-orm";
import { z } from "zod";
import { AccessError, type AccessContext } from "./access";
import type { DbTransaction } from "./db";
import { auditEvents, customers, documentCounters, filaments, orders, orderStatusEvents, productionAttempts, payments, quotes,
  quoteMaterials, quotePostprocesses, quotePriceOptions, quoteRevisions } from "./db/schema";
import { calculateQuote, D, quantize, quoteInputSchema } from "./finance";

const key = z.object({ idempotencyKey: z.uuid() });
const edit = key.extend({ quoteId: z.uuid(), expectedVersion: z.coerce.number().int().positive(), revisionId: z.uuid().optional() });
const create = quoteInputSchema.extend(key.shape).strict();
const update = quoteInputSchema.extend(edit.shape).strict();
const result = (id: string, entityType = "quotes") => ({ id, entityType });

async function audit(tx: DbTransaction, ctx: AccessContext, action: string, id: string, metadata: Record<string, unknown> = {}) {
  await tx.insert(auditEvents).values({ orgId: ctx.organizationId, actorId: ctx.userId,
    entityType: action.split(".")[0], entityId: id, action, metadata });
}

async function nextCode(tx: DbTransaction, ctx: AccessContext, kind: "COT" | "PED") {
  const [counter] = await tx.select().from(documentCounters).where(and(
    eq(documentCounters.organizationId, ctx.organizationId), eq(documentCounters.kind, kind))).for("update");
  if (!counter) throw new AccessError("SERVICE_UNAVAILABLE", "Contador no inicializado.");
  await tx.update(documentCounters).set({ nextValue: counter.nextValue + 1n }).where(and(
    eq(documentCounters.organizationId, ctx.organizationId), eq(documentCounters.kind, kind)));
  return { sequenceNumber: counter.nextValue, code: `${kind}-${counter.nextValue.toString().padStart(6, "0")}` };
}

function date(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new AccessError("VALIDATION_ERROR", "La fecha no existe en el calendario.");
  }
}

async function persistRevision(tx: DbTransaction, ctx: AccessContext, quoteId: string, revisionNumber: number,
  raw: z.input<typeof quoteInputSchema>, revisionId = randomUUID()) {
  const input = quoteInputSchema.parse(raw);
  date(input.businessDate);
  if (input.validUntil) { date(input.validUntil); if (input.validUntil < input.businessDate) throw new AccessError("VALIDATION_ERROR", "La validez no puede ser anterior a la cotización."); }
  let clientSnapshot: Record<string, unknown> | null = null;
  if (input.customerId) {
    const [client] = await tx.select().from(customers).where(and(eq(customers.orgId, ctx.organizationId),
      eq(customers.id, input.customerId), isNull(customers.archivedAt))).limit(1);
    if (!client) throw new AccessError("NOT_FOUND", "Cliente no encontrado o archivado.");
    clientSnapshot = { name: client.name, contactPhone: client.contactPhone, email: client.email };
  }
  const materialSnapshots = [];
  for (const line of input.materials) {
    const [filament] = await tx.select().from(filaments).where(and(eq(filaments.orgId, ctx.organizationId),
      eq(filaments.id, line.filamentId), isNull(filaments.archivedAt))).limit(1);
    if (!filament) throw new AccessError("NOT_FOUND", "Filamento no encontrado o archivado.");
    materialSnapshots.push({ line, snapshot: { brand: filament.brand, model: filament.model,
      materialType: filament.materialType, color: filament.color } });
  }
  const calculated = calculateQuote(input);
  await tx.insert(quoteRevisions).values({ id: revisionId, orgId: ctx.organizationId, createdBy: ctx.userId,
    quoteId, revisionNumber, status: "draft", projectName: input.projectName, description: input.description,
    clientSnapshot, printSeconds: BigInt(input.printSeconds), formulaSnapshot: { formulaVersion: 1, ...input.formula, inputSnapshot: input },
    materialCost: calculated.components.material, energyCost: calculated.components.energy,
    machineCost: calculated.components.machine, contingencyCost: calculated.components.contingency,
    postprocessCost: calculated.components.postprocess, estimatedCost: calculated.costProduction,
    quotedPrice: calculated.selectedPrice, businessDate: input.businessDate, validUntil: input.validUntil,
    customerNotes: input.customerNotes, internalNotes: input.internalNotes });
  await tx.insert(quoteMaterials).values(materialSnapshots.map(({ line, snapshot }, position) => ({
    orgId: ctx.organizationId, createdBy: ctx.userId, revisionId, filamentId: line.filamentId, filamentSnapshot: snapshot,
    grams: line.grams, pricePerGram: line.pricePerGram, cost: quantize(new D(line.grams).times(line.pricePerGram)), position })));
  if (input.postprocess.length) await tx.insert(quotePostprocesses).values(input.postprocess.map((line, position) => ({
    orgId: ctx.organizationId, createdBy: ctx.userId, revisionId, description: line.description,
    category: line.category, estimatedAmount: line.amount, position })));
  const options = await tx.insert(quotePriceOptions).values(calculated.priceOptions.map((option) => ({
    orgId: ctx.organizationId, createdBy: ctx.userId, revisionId, level: option.level,
    label: { minimum: "Mínimo", medium: "Medio", high: "Alto" }[option.level], multiplier: option.multiplier,
    price: option.price, profitValue: option.profit, marginPercent: option.marginPercent }))).returning();
  const selected = options.find((option) => option.level === input.selectedLevel)!;
  await tx.update(quoteRevisions).set({ selectedOptionId: selected.id }).where(eq(quoteRevisions.id, revisionId));
  await tx.update(quotes).set({ currentRevisionId: revisionId, customerId: input.customerId ?? null, updatedAt: new Date() }).where(eq(quotes.id, quoteId));
  return revisionId;
}

async function lockedQuote(tx: DbTransaction, ctx: AccessContext, data: z.infer<typeof edit>) {
  const [quote] = await tx.select().from(quotes).where(and(eq(quotes.orgId, ctx.organizationId), eq(quotes.id, data.quoteId))).for("update");
  if (!quote) throw new AccessError("NOT_FOUND", "Cotización no encontrada.");
  if (quote.version !== data.expectedVersion) throw new AccessError("VERSION_CONFLICT", "La cotización cambió; recarga antes de editar.");
  const [revision] = await tx.select().from(quoteRevisions).where(and(eq(quoteRevisions.orgId, ctx.organizationId),
    eq(quoteRevisions.quoteId, quote.id), eq(quoteRevisions.id, data.revisionId ?? quote.currentRevisionId ?? "00000000-0000-0000-0000-000000000000"))).for("update");
  if (!revision) throw new AccessError("NOT_FOUND", "Revisión no encontrada.");
  return { quote, revision };
}

async function convert(tx: DbTransaction, ctx: AccessContext, quote: typeof quotes.$inferSelect,
  revision: typeof quoteRevisions.$inferSelect, customerId?: string, existingIntakeId?: string) {
  if (revision.status !== "accepted" || revision.quotedPrice === null) throw new AccessError("INVALID_TRANSITION", "Acepta la cotización antes de convertirla.");
  const clientId = customerId ?? quote.customerId;
  if (!clientId) throw new AccessError("VALIDATION_ERROR", "Selecciona un cliente para confirmar el pedido.");
  const [client] = await tx.select({ id: customers.id }).from(customers).where(and(eq(customers.orgId, ctx.organizationId),
    eq(customers.id, clientId), isNull(customers.archivedAt))).limit(1);
  if (!client) throw new AccessError("NOT_FOUND", "Cliente no encontrado o archivado.");
  const [existing] = await tx.select().from(orders).where(and(eq(orders.orgId, ctx.organizationId), eq(orders.sourceQuoteId, quote.id), eq(orders.customerId, clientId))).limit(1);
  if (existing) {if(existingIntakeId&&existing.id!==existingIntakeId)throw new AccessError("DEPENDENCY_CONFLICT","Esta cotización ya está vinculada a otro pedido de este cliente.");return result(existing.id, "orders");}
  let orderId: string;
  if (existingIntakeId) {
    const [intake] = await tx.select().from(orders).where(and(eq(orders.orgId, ctx.organizationId), eq(orders.id, existingIntakeId))).for("update");
    if (!intake) throw new AccessError("NOT_FOUND", "Pedido provisional no encontrado.");
    if (intake.confirmedAt || intake.status !== "not_started" || intake.customerId !== clientId) throw new AccessError("INVALID_TRANSITION", "El pedido provisional no admite esta cotización.");
    orderId = intake.id;
    await tx.update(orders).set({ sourceQuoteId: quote.id, acceptedRevisionId: revision.id,
      agreedPrice: revision.quotedPrice, confirmedAt: new Date(), version: intake.version + 1, updatedAt: new Date() }).where(eq(orders.id, intake.id));
  } else {
    const code = await nextCode(tx, ctx, "PED");
    const [order] = await tx.insert(orders).values({ ...code, orgId: ctx.organizationId, createdBy: ctx.userId,
      customerId: clientId, sourceQuoteId: quote.id, acceptedRevisionId: revision.id, title: revision.projectName,
      status: "not_started", orderDate: revision.businessDate, agreedPrice: revision.quotedPrice, confirmedAt: new Date() }).returning({ id: orders.id });
    orderId = order.id;
    await tx.insert(orderStatusEvents).values({ orgId: ctx.organizationId, orderId, toStatus: "not_started", actorId: ctx.userId });
  }
  await audit(tx, ctx, "orders.convertQuote", orderId, { quoteId: quote.id, revisionId: revision.id });
  return result(orderId, "orders");
}

export async function executeQuoteCommand(command: string, raw: Record<string, unknown>, ctx: AccessContext, tx: DbTransaction) {
  const operation = command.split(".")[1];
  if (command === "orders.createIntake") {
    const data = key.extend({ customerId: z.uuid(), title: z.string().trim().min(1).max(200),
      orderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), notes: z.string().max(5000).optional() }).strict().parse(raw);
    date(data.orderDate);
    const [client] = await tx.select({ id: customers.id }).from(customers).where(and(eq(customers.orgId, ctx.organizationId),
      eq(customers.id, data.customerId), isNull(customers.archivedAt))).limit(1);
    if (!client) throw new AccessError("NOT_FOUND", "Cliente no encontrado o archivado.");
    const code = await nextCode(tx, ctx, "PED");
    const [order] = await tx.insert(orders).values({ ...code, orgId: ctx.organizationId, createdBy: ctx.userId,
      customerId: data.customerId, title: data.title, orderDate: data.orderDate, notes: data.notes }).returning({ id: orders.id });
    await tx.insert(orderStatusEvents).values({ orgId: ctx.organizationId, orderId: order.id, toStatus: "not_started", actorId: ctx.userId });
    await audit(tx, ctx, command, order.id);
    return result(order.id, "orders");
  }
  if(command === "orders.updateCommercial") {
    if(ctx.role!=="administrator")throw new AccessError("FORBIDDEN","Solo el administrador puede modificar los valores comerciales.");
    const amount=z.string().regex(/^\d{1,12}(\.\d{1,6})?$/);
    const data=key.extend({orderId:z.uuid(),expectedVersion:z.coerce.number().int().positive(),agreedPrice:z.string().regex(/^\d{1,18}$/),estimatedCost:amount,reason:z.string().trim().min(1).max(5000)}).strict().parse(raw);
    const [order]=await tx.select().from(orders).where(and(eq(orders.orgId,ctx.organizationId),eq(orders.id,data.orderId))).for("update");
    if(!order||order.archivedAt)throw new AccessError("NOT_FOUND","Pedido no encontrado.");
    if(order.closedAt)throw new AccessError("ORDER_CLOSED","El pedido está cerrado y no admite modificaciones.");
    if(!order.confirmedAt)throw new AccessError("INVALID_TRANSITION","Vincula una cotización aceptada antes de modificar los valores.");
    if(order.version!==data.expectedVersion)throw new AccessError("VERSION_CONFLICT","El pedido cambió; recarga antes de editar.");
    const paid=await tx.select({amount:payments.amount}).from(payments).where(and(eq(payments.orgId,ctx.organizationId),eq(payments.orderId,order.id),isNull(payments.voidedAt)));
    const received=paid.reduce((total,p)=>total.plus(p.amount),new D(0));
    if(new D(data.agreedPrice).lt(received))throw new AccessError("DEPENDENCY_CONFLICT","El precio no puede ser menor que los pagos recibidos.");
    const [revision]=await tx.select({estimatedCost:quoteRevisions.estimatedCost}).from(quoteRevisions).where(and(eq(quoteRevisions.orgId,ctx.organizationId),eq(quoteRevisions.id,order.acceptedRevisionId!)));
    await tx.update(orders).set({agreedPrice:data.agreedPrice,estimatedCostOverride:data.estimatedCost,version:order.version+1,updatedAt:new Date()}).where(eq(orders.id,order.id));
    await audit(tx,ctx,command,order.id,{reason:data.reason,before:{agreedPrice:order.agreedPrice,estimatedCost:order.estimatedCostOverride??revision?.estimatedCost},after:{agreedPrice:data.agreedPrice,estimatedCost:data.estimatedCost}});
    return result(order.id,"orders");
  }
  if (["orders.updateMetadata", "orders.archive", "orders.deleteUnusedIntake"].includes(command)) {
    const base = key.extend({ orderId: z.uuid(), expectedVersion: z.coerce.number().int().positive() });
    const data = base.parse(raw);
    const [order] = await tx.select().from(orders).where(and(eq(orders.orgId, ctx.organizationId), eq(orders.id, data.orderId))).for("update");
    if (!order) throw new AccessError("NOT_FOUND", "Pedido no encontrado.");
    if (order.closedAt) throw new AccessError("ORDER_CLOSED", "El pedido está cerrado y no admite modificaciones.");
    if (order.version !== data.expectedVersion) throw new AccessError("VERSION_CONFLICT", "El pedido cambió; recarga antes de editar.");
    if (operation === "updateMetadata") {
      const metadata = base.extend({ title: z.string().trim().min(1).max(200), notes: z.string().max(5000).optional(),
        promisedDeliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }).strict().parse(raw);
      if (metadata.promisedDeliveryDate) date(metadata.promisedDeliveryDate);
      await tx.update(orders).set({ title: metadata.title, notes: metadata.notes,
        promisedDeliveryDate: metadata.promisedDeliveryDate, version: order.version + 1, updatedAt: new Date() }).where(eq(orders.id, order.id));
    } else if (operation === "archive") {
      base.strict().parse(raw);
      await tx.update(orders).set({ archivedAt: new Date(), version: order.version + 1, updatedAt: new Date() }).where(eq(orders.id, order.id));
    } else {
      base.strict().parse(raw);
      if (order.confirmedAt || order.status !== "not_started") throw new AccessError("DEPENDENCY_CONFLICT", "Solo un pedido provisional sin actividad puede eliminarse.");
      const attempts = await tx.select({ id: productionAttempts.id }).from(productionAttempts).where(eq(productionAttempts.orderId, order.id)).limit(1);
      const recordedPayments = await tx.select({ id: payments.id }).from(payments).where(eq(payments.orderId, order.id)).limit(1);
      if (attempts.length || recordedPayments.length) throw new AccessError("DEPENDENCY_CONFLICT", "El pedido tiene historial y se debe conservar.");
      await tx.delete(orderStatusEvents).where(eq(orderStatusEvents.orderId, order.id));
      await tx.delete(orders).where(eq(orders.id, order.id));
    }
    await audit(tx, ctx, command, order.id);
    return result(order.id, "orders");
  }
  if (command === "quotes.createDraft") {
    const { idempotencyKey: _key, ...input } = create.parse(raw);
    const code = await nextCode(tx, ctx, "COT");
    const [quote] = await tx.insert(quotes).values({ ...code, orgId: ctx.organizationId, createdBy: ctx.userId }).returning();
    await persistRevision(tx, ctx, quote.id, 1, input);
    await audit(tx, ctx, command, quote.id);
    return result(quote.id);
  }
  if (command === "orders.convertQuote" || operation === "acceptAndConvert") {
    const data = edit.extend({ acceptedRevisionId: z.uuid().optional(), customerId: z.uuid().optional(), existingIntakeId: z.uuid().optional() }).strict().parse(raw);
    const { quote, revision } = await lockedQuote(tx, ctx, { ...data, revisionId: data.acceptedRevisionId ?? data.revisionId });
    if (operation === "acceptAndConvert") {
      if (revision.status !== "sent" && revision.status !== "accepted") throw new AccessError("INVALID_TRANSITION", "Envía la cotización antes de aceptarla.");
      if (revision.status === "sent") {
        await tx.update(quoteRevisions).set({ status: "accepted", acceptedAt: new Date(), version: revision.version + 1 }).where(eq(quoteRevisions.id, revision.id));
        await tx.update(quotes).set({ version: quote.version + 1, updatedAt: new Date() }).where(eq(quotes.id, quote.id));
        await audit(tx, ctx, "quotes.accept", quote.id, { revisionId: revision.id });
        revision.status = "accepted";
      }
    }
    return convert(tx, ctx, quote, revision, data.customerId, data.existingIntakeId);
  }
  const baseEdit = edit.parse(raw);
  const data = operation === "revise" && raw.sourceRevisionId !== undefined
    ? { ...baseEdit, revisionId: z.uuid().parse(raw.sourceRevisionId) } : baseEdit;
  const { quote, revision } = await lockedQuote(tx, ctx, data);
  const [linked] = await tx.select({ id: orders.id }).from(orders).where(and(eq(orders.orgId, ctx.organizationId), eq(orders.sourceQuoteId, quote.id))).limit(1);
  if (operation === "updateDraft" || operation === "revise") {
    const parsed = update.extend({ sourceRevisionId: z.uuid().optional() }).strict().parse(raw);
    if (linked || revision.status === "accepted") throw new AccessError("INVALID_TRANSITION", "La cotización aceptada conserva su contrato; duplica para una propuesta nueva.");
    const { quoteId: _id, expectedVersion: _version, revisionId: _revision, sourceRevisionId: _source, idempotencyKey: _key, ...input } = parsed;
    if (operation === "updateDraft" && revision.status !== "draft") throw new AccessError("INVALID_TRANSITION", "Una revisión publicada requiere una nueva revisión.");
    if (operation === "updateDraft" && revision.id !== quote.currentRevisionId) throw new AccessError("INVALID_TRANSITION", "Solo el borrador actual admite edición directa.");
    // The source may be a historic revision. Allocate after the highest number
    // while holding the quote lock; sourceNumber + 1 can collide with history.
    const [historyNumber] = await tx.select({ value: max(quoteRevisions.revisionNumber) }).from(quoteRevisions)
      .where(and(eq(quoteRevisions.orgId, ctx.organizationId), eq(quoteRevisions.quoteId, quote.id)));
    let number = (historyNumber.value ?? 0) + 1;
    if (operation === "updateDraft") {
      // Draft rows have no commercial evidence; replace their components atomically.
      number = revision.revisionNumber;
      await tx.update(quotes).set({ currentRevisionId: null }).where(eq(quotes.id, quote.id));
      await tx.update(quoteRevisions).set({ selectedOptionId: null }).where(eq(quoteRevisions.id, revision.id));
      await tx.delete(quoteMaterials).where(eq(quoteMaterials.revisionId, revision.id));
      await tx.delete(quotePostprocesses).where(eq(quotePostprocesses.revisionId, revision.id));
      await tx.delete(quotePriceOptions).where(eq(quotePriceOptions.revisionId, revision.id));
      await tx.delete(quoteRevisions).where(eq(quoteRevisions.id, revision.id));
    }
    await persistRevision(tx, ctx, quote.id, number, input);
  } else if (operation === "duplicate") {
    edit.strict().parse(raw);
    const snapshot = revision.formulaSnapshot as { inputSnapshot?: z.input<typeof quoteInputSchema> };
    if (!snapshot.inputSnapshot) throw new AccessError("DEPENDENCY_CONFLICT", "Snapshot de origen incompleto.");
    const code = await nextCode(tx, ctx, "COT");
    const [copy] = await tx.insert(quotes).values({ ...code, orgId: ctx.organizationId, createdBy: ctx.userId, duplicatedFromId: quote.id }).returning();
    await persistRevision(tx, ctx, copy.id, 1, snapshot.inputSnapshot);
    await audit(tx, ctx, command, copy.id, { sourceQuoteId: quote.id });
    return result(copy.id);
  } else if (["publish", "accept", "reject"].includes(operation)) {
    const stateInput = edit.extend({ reason: z.string().trim().min(1).max(5000).optional() }).strict().parse(raw);
    if (data.revisionId && data.revisionId !== quote.currentRevisionId) throw new AccessError("INVALID_TRANSITION", "Solo la revisión actual admite cambios de estado.");
    const next = operation === "publish" ? "sent" : operation === "accept" ? "accepted" : "rejected";
    if ((operation === "publish" && revision.status !== "draft") || (operation !== "publish" && revision.status !== "sent") || linked) {
      throw new AccessError("INVALID_TRANSITION", "La revisión no admite esta transición.");
    }
    if (operation === "reject" && !stateInput.reason) throw new AccessError("VALIDATION_ERROR", "Indica el motivo del rechazo.");
    const snapshot = revision.formulaSnapshot as { inputSnapshot?: z.input<typeof quoteInputSchema> };
    if (operation === "publish") {
      if (!snapshot.inputSnapshot || revision.quotedPrice !== calculateQuote(snapshot.inputSnapshot).selectedPrice) {
        throw new AccessError("DEPENDENCY_CONFLICT", "El cálculo de la revisión no corresponde al snapshot.");
      }
    }
    await tx.update(quoteRevisions).set({ status: next, version: revision.version + 1, updatedAt: new Date(),
      ...(operation === "publish" ? { sentAt: new Date() } : operation === "accept" ? { acceptedAt: new Date() } : { rejectedAt: new Date() }) }).where(eq(quoteRevisions.id, revision.id));
  } else if (operation === "archive") {
    edit.strict().parse(raw);
    await tx.update(quotes).set({ archivedAt: new Date() }).where(eq(quotes.id, quote.id));
  } else if (operation === "deleteUnusedDraft") {
    edit.strict().parse(raw);
    const history = await tx.select({ status: quoteRevisions.status }).from(quoteRevisions).where(eq(quoteRevisions.quoteId, quote.id));
    if (linked || history.some((r) => r.status !== "draft")) throw new AccessError("DEPENDENCY_CONFLICT", "La cotización tiene evidencia publicada y se debe conservar.");
    await tx.update(quotes).set({ currentRevisionId: null }).where(eq(quotes.id, quote.id));
    for (const row of await tx.select({ id: quoteRevisions.id }).from(quoteRevisions).where(eq(quoteRevisions.quoteId, quote.id))) {
      await tx.update(quoteRevisions).set({ selectedOptionId: null }).where(eq(quoteRevisions.id, row.id));
      await tx.delete(quoteMaterials).where(eq(quoteMaterials.revisionId, row.id));
      await tx.delete(quotePostprocesses).where(eq(quotePostprocesses.revisionId, row.id));
      await tx.delete(quotePriceOptions).where(eq(quotePriceOptions.revisionId, row.id));
    }
    await tx.delete(quoteRevisions).where(eq(quoteRevisions.quoteId, quote.id));
    await tx.delete(quotes).where(eq(quotes.id, quote.id));
    await audit(tx, ctx, command, quote.id);
    return result(quote.id);
  } else throw new AccessError("VALIDATION_ERROR", "Operación de cotización inválida.");
  await tx.update(quotes).set({ version: quote.version + 1, updatedAt: new Date() }).where(eq(quotes.id, quote.id));
  await audit(tx, ctx, command, quote.id, { revisionId: revision.id });
  return result(quote.id);
}
