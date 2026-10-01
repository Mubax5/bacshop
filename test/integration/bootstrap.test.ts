import { randomBytes, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { Pool } from "pg";
import { expect, it } from "vitest";

const connectionString = process.env.BACSHOP_INTEGRATION_DATABASE_URL;
if (!connectionString || !new URL(connectionString).pathname.endsWith("_integration")) {
  throw new Error("Set BACSHOP_INTEGRATION_DATABASE_URL to an isolated database ending in _integration");
}

it("bootstraps the first admin through the real CLI and permanently closes repeat bootstrap", async () => {
  const databaseName = `bacshop_bootstrap_${randomUUID().replaceAll("-", "")}_integration`;
  // Generated identifier, never derived from user input. Only this new disposable database is dropped.
  const administration = new Pool({ connectionString });
  const freshUrl = new URL(connectionString);
  freshUrl.pathname = `/${databaseName}`;
  const email = `${randomUUID()}@bacshop.test`;
  const password = randomBytes(24).toString("hex");
  const env: NodeJS.ProcessEnv = {
    ...process.env, DATABASE_URL: freshUrl.toString(), DIRECT_URL: freshUrl.toString(),
    NODE_ENV: "test", BACSHOP_RUNTIME: "database", APP_ORIGIN: "http://127.0.0.1:4175",
    TRUSTED_ORIGINS: "http://127.0.0.1:4175", SESSION_SECRET: randomBytes(32).toString("hex"),
    MFA_ENCRYPTION_KEY: randomBytes(32).toString("hex"), EMAIL_ENABLED: "false", EMAIL_REQUIRED: "false",
    ADMIN_BOOTSTRAP_EMAIL: email, ADMIN_BOOTSTRAP_PASSWORD: password, ADMIN_BOOTSTRAP_DISPLAY_NAME: "Bootstrap test",
  };
  let created = false;
  let database: Pool | undefined;
  try {
    await administration.query(`CREATE DATABASE "${databaseName}"`);
    created = true;
    const migration = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], { env, encoding: "utf8", timeout: 45_000 });
    expect(migration.status, `Disposable migrations failed (${migration.error?.name ?? "exit"}); ${migration.stdout.replaceAll(freshUrl.toString(), "[database]")}`).toBe(0);
    const first = spawnSync(process.execPath, ["--import", "tsx", "scripts/bootstrap-admin.ts"], { env, encoding: "utf8", timeout: 30_000 });
    expect(first.status, "First admin bootstrap CLI failed").toBe(0);
    expect(first.stdout).toContain("MFA enrollment is required");
    expect(`${first.stdout}${first.stderr}`).not.toContain(password);
    const second = spawnSync(process.execPath, ["--import", "tsx", "scripts/bootstrap-admin.ts"], { env, encoding: "utf8", timeout: 30_000 });
    expect(second.status, "Repeat bootstrap must fail").toBe(1);
    database = new Pool({ connectionString: freshUrl.toString() });
    const admin = await database.query('SELECT "u"."id", "a"."role" FROM "users" "u" JOIN "admin_role_assignments" "a" ON "a"."userId"="u"."id" WHERE "u"."email"=$1', [email]);
    expect(admin.rows).toHaveLength(1);
    expect(admin.rows[0].role).toBe("SUPER_ADMIN");
    expect((await database.query('SELECT "id" FROM "mfa_factors" WHERE "userId"=$1', [admin.rows[0].id])).rowCount).toBe(0);
    expect((await database.query('SELECT "id" FROM "audit_events" WHERE "action"=\'identity.admin_bootstrap\'')).rowCount).toBe(1);
  } finally {
    await database?.end();
    if (created) await administration.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`);
    await administration.end();
  }
}, 90_000);
