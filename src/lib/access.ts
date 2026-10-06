import "server-only";

import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { memberships as membership } from "@/lib/db/schema";

export type BusinessRole = "administrator" | "operator";
export type AccessContext = {
  userId: string; organizationId: string; membershipId: string; sessionId: string;
  role: BusinessRole; name: string; email: string;
};
export class AccessError extends Error {
  constructor(public readonly code: string, message: string) { super(message); this.name = "AccessError"; }
}

export async function requireAccess(requiredRole?: BusinessRole): Promise<AccessContext> {
  const session = await getAuth().api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  if (!session || session.session.impersonatedBy) {
    throw new AccessError("UNAUTHENTICATED", "Inicia sesión para continuar.");
  }
  const [member] = await getDb().select().from(membership)
    .where(and(eq(membership.userId, session.user.id), eq(membership.active, true))).limit(1);
  if (!member || (member.role !== "administrator" && member.role !== "operator")) {
    throw new AccessError("FORBIDDEN", "No tienes acceso activo a la empresa.");
  }
  if (requiredRole === "administrator" && member.role !== "administrator") {
    throw new AccessError("FORBIDDEN", "Esta operación requiere un administrador.");
  }
  return {
    userId: session.user.id, organizationId: member.organizationId,
    membershipId: member.id, sessionId: session.session.id, role: member.role,
    name: session.user.name, email: session.user.email,
  };
}
