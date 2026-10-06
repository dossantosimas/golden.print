import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { AccessError, requireAccess } from "@/lib/access";
import { getDb } from "@/lib/db";
import { quotes, quoteRevisions } from "@/lib/db/schema";
import { renderCommercialQuote } from "@/lib/quote-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(_request: Request, context: { params: Promise<{ quoteId: string; revisionId: string }> }) {
  const requestId = randomUUID();
  try {
    const access = await requireAccess();
    const params = z.object({ quoteId: z.uuid(), revisionId: z.uuid() }).parse(await context.params);
    const [row] = await getDb().select({ code: quotes.code, revisionNumber: quoteRevisions.revisionNumber,
      status: quoteRevisions.status, projectName: quoteRevisions.projectName, description: quoteRevisions.description,
      clientSnapshot: quoteRevisions.clientSnapshot, price: quoteRevisions.quotedPrice,
      businessDate: quoteRevisions.businessDate, validUntil: quoteRevisions.validUntil,
      customerNotes: quoteRevisions.customerNotes }).from(quoteRevisions)
      .innerJoin(quotes, and(eq(quotes.id, quoteRevisions.quoteId), eq(quotes.orgId, quoteRevisions.orgId)))
      .where(and(eq(quoteRevisions.orgId, access.organizationId), eq(quoteRevisions.quoteId, params.quoteId),
        eq(quoteRevisions.id, params.revisionId))).limit(1);
    if (!row || row.price === null || !["draft", "sent", "accepted", "rejected"].includes(row.status)) {
      throw new AccessError("NOT_FOUND", "Revisión no encontrada.");
    }
    const client = row.clientSnapshot as { name?: string; contactPhone?: string } | null;
    const bytes = await renderCommercialQuote({ code: row.code, revisionNumber: row.revisionNumber, status: row.status,
      projectName: row.projectName, description: row.description, customerName: client?.name ?? "Sin cliente",
      customerContact: client?.contactPhone, price: row.price, businessDate: row.businessDate,
      validUntil: row.validUntil, customerNotes: row.customerNotes });
    const filename = `${row.code.replace(/[^A-Za-z0-9_-]/g, "")}-R${row.revisionNumber}.pdf`;
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store", "X-Request-Id": requestId } });
  } catch (error) {
    const code = error instanceof AccessError ? error.code : error instanceof z.ZodError ? "NOT_FOUND" : "SERVICE_UNAVAILABLE";
    const status = code === "UNAUTHENTICATED" ? 401 : code === "FORBIDDEN" ? 403 : code === "NOT_FOUND" ? 404 : 503;
    return Response.json({ ok: false, requestId, error: { code, message: status === 404 ? "Revisión no encontrada." : "No se pudo generar el documento.", retryable: status === 503 } },
      { status, headers: { "Cache-Control": "private, no-store", "X-Request-Id": requestId } });
  }
}
