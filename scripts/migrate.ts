import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function main() {
  const connectionString = process.env.MIGRATION_DATABASE_URL;
  if (!connectionString) throw new Error("Configura MIGRATION_DATABASE_URL directa para ejecutar migraciones.");
  const pool = new Pool({ connectionString, max: 1, connectionTimeoutMillis: 10_000, application_name: "golden-print-migration" });
  try {
    await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
    console.log("Migraciones aplicadas.");
  } finally { await pool.end(); }
}
main().catch((error: unknown) => {
  const detail = error as { code?: string; cause?: { code?: string; message?: string }; message?: string };
  const message = (detail.cause?.message ?? detail.message ?? "Error desconocido").replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[URL privada]");
  console.error("Falló la migración:", detail.cause?.code ?? detail.code ?? "CONNECTION_ERROR", message);
  process.exitCode = 1;
});
