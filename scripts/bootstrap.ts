import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";

// Private provisioner. It is deliberately independent of the Next.js handler.
async function readSecret(): Promise<string> {
  if (process.env.BOOTSTRAP_PASSWORD) {
    const password = process.env.BOOTSTRAP_PASSWORD;
    delete process.env.BOOTSTRAP_PASSWORD;
    return password;
  }
  if (!stdin.isTTY) throw new Error("La contraseña requiere una terminal privada o BOOTSTRAP_PASSWORD del entorno privado.");
  stdout.write("Contraseña (mínimo 12 caracteres; entrada oculta): ");
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");
  return new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => { stdin.off("data", onData); stdin.setRawMode(false); stdin.pause(); stdout.write("\n"); };
    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === "\u0003") { cleanup(); reject(new Error("Provisionamiento cancelado.")); return; }
        if (character === "\r" || character === "\n") { cleanup(); resolve(value); return; }
        if (character === "\u007f" || character === "\b") value = value.slice(0, -1);
        else if (character >= " ") value += character;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const input = createInterface({ input: stdin, output: stdout });
  const name = process.env.BOOTSTRAP_NAME ?? await input.question("Nombre del administrador: ");
  const email = process.env.BOOTSTRAP_EMAIL ?? await input.question("Correo del administrador: ");
  input.close();
  const password = await readSecret();
  const credentials = z.object({
    name: z.string().trim().min(1).max(200), email: z.email().transform((v) => v.toLowerCase()),
    password: z.string().min(12).max(128),
  }).safeParse({ name, email: email.trim(), password });
  if (!credentials.success) throw new Error("Nombre, correo o contraseña inválidos; no se crearon datos.");
  const passwordHash = await hashPassword(credentials.data.password);
  const connection = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connection) throw new Error("Configura la conexión privada de PostgreSQL.");
  const url = new URL(connection);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (!local) url.searchParams.delete("sslmode");
  const pool = new Pool({ connectionString: url.toString(), max: 1, connectionTimeoutMillis: 10_000,
    ...(local ? {} : { ssl: { rejectUnauthorized: true } }) });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('golden-print-3d:access', 0))");
    const existing = await client.query("SELECT id FROM organization WHERE singleton_key = 1");
    if (existing.rowCount) throw new Error("La empresa ya fue inicializada. Bootstrap no sobrescribe usuarios ni datos.");
    const orgId = randomUUID();
    const userId = randomUUID();
    await client.query(`INSERT INTO organization (id, singleton_key, name, currency, timezone, bootstrap_completed_at)
      VALUES ($1, 1, 'Golden Print 3D', 'COP', 'America/Bogota', now())`, [orgId]);
    await client.query(`INSERT INTO "user" (id, name, email, email_verified, role, banned, created_at, updated_at)
      VALUES ($1, $2, $3, true, 'admin', false, now(), now())`, [userId, credentials.data.name, credentials.data.email]);
    await client.query(`INSERT INTO account (id, user_id, account_id, provider_id, password, created_at, updated_at)
      VALUES ($1, $2, $2, 'credential', $3, now(), now())`, [randomUUID(), userId, passwordHash]);
    await client.query(`INSERT INTO membership (id, organization_id, user_id, role, active, version)
      VALUES ($1, $2, $3, 'administrator', true, 1)`, [randomUUID(), orgId, userId]);
    await client.query(`INSERT INTO business_settings (organization_id, formula_version, machine_hour_rate, power_kw,
      energy_kwh_rate, contingency_rate, minimum_multiplier, medium_multiplier, high_multiplier, updated_by, version)
      VALUES ($1, 1, '2000', '0.15', '1100', '0.10', '2', '2.5', '3', $2, 1)`, [orgId, userId]);
    await client.query("INSERT INTO document_counter (organization_id, kind, next_value) VALUES ($1,'COT',1),($1,'PED',1)", [orgId]);
    await client.query(`INSERT INTO audit_event (id, org_id, actor_id, entity_type, entity_id, action, metadata)
      VALUES ($1,$2,$3,'organization',$4,'bootstrap.completed','{}'::jsonb)`, [randomUUID(), orgId, userId, orgId]);
    await client.query("COMMIT");
    stdout.write("Empresa inicializada. El administrador ya puede iniciar sesión.\n");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); await pool.end(); }
}

main().catch((error: unknown) => {
  // Database error detail may contain emails or parameters. Never print it.
  const message = error instanceof Error && !("code" in error) ? error.message : "Provisionamiento fallido; la transacción fue revertida.";
  console.error(message);
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string" && /^[A-Z0-9]{5}$/.test(error.code)) {
    console.error(`Código PostgreSQL: ${error.code}`);
  }
  process.exitCode = 1;
});
