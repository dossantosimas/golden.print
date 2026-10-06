import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Database = NodePgDatabase<typeof schema>;
const state = globalThis as typeof globalThis & { goldenPrintPool?: Pool; goldenPrintDb?: Database };

/** Creating/importing a module does not connect to PostgreSQL or require build secrets. */
export function getPool(): Pool {
  if (!state.goldenPrintPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL no está configurada.");
    state.goldenPrintPool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000, statement_timeout: 20_000, application_name: "golden-print-3d-app" });
    // Prevent an idle socket error from crashing the process; do not log URL or credentials.
    state.goldenPrintPool.on("error", () => console.error("PostgreSQL: conexión inactiva interrumpida."));
  }
  return state.goldenPrintPool;
}
export function getDb(): Database {
  state.goldenPrintDb ??= drizzle(getPool(), { schema });
  return state.goldenPrintDb;
}
export type Db = Database;
export type DbTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
