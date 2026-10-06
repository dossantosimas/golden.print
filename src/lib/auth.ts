import "server-only";

import { randomUUID } from "node:crypto";
import { betterAuth, APIError } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { nextCookies } from "better-auth/next-js";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";

function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!secret || secret.length < 32 || !baseURL) {
    throw new Error("Configura BETTER_AUTH_SECRET (mínimo 32 caracteres) y BETTER_AUTH_URL.");
  }
  const origin = new URL(baseURL).origin;
  if (process.env.NODE_ENV === "production" && !origin.startsWith("https://")) {
    throw new Error("BETTER_AUTH_URL debe usar HTTPS en producción.");
  }

  return betterAuth({
    appName: "Golden Print 3D",
    baseURL,
    secret,
    trustedOrigins: [origin],
    database: drizzleAdapter(getDb(), { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
    },
    session: {
      expiresIn: 60 * 60 * 8,
      updateAge: 60 * 60,
      cookieCache: { enabled: false },
    },
    // A function generates IDs in the adapter. The "uuid" shortcut delegates
    // to database defaults, but auth tables use text IDs without SQL defaults.
    advanced: { database: { generateId: () => randomUUID() }, useSecureCookies: origin.startsWith("https://") },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
      customRules: { "/sign-in/email": { window: 60, max: 5 }, "/change-password": { window: 60, max: 5 } },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const [member] = await getDb().select({ id: schema.memberships.id })
              .from(schema.memberships)
              .where(and(eq(schema.memberships.userId, session.userId), eq(schema.memberships.active, true)))
              .limit(1);
            if (!member) throw new APIError("FORBIDDEN", { message: "Acceso a la empresa deshabilitado." });
            return { data: session };
          },
        },
      },
    },
    plugins: [admin({ defaultRole: "user", adminRoles: ["admin"] }), nextCookies()],
  });
}

let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  return instance ??= createAuth();
}
