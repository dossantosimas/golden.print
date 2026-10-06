import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql", schema: "./src/lib/db/schema.ts", out: "./drizzle",
  // Generation needs no database; push/introspect must use a separately supplied migration URL.
  ...(process.env.MIGRATION_DATABASE_URL ? { dbCredentials: { url: process.env.MIGRATION_DATABASE_URL } } : {}),
  strict: true, verbose: true,
});
