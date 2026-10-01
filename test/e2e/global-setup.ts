import { Pool } from "pg";
import type { FullConfig } from "@playwright/test";

export default async function globalSetup(config: FullConfig) {
  const connectionString = process.env.BACSHOP_INTEGRATION_DATABASE_URL;
  if (!connectionString || !new URL(connectionString).pathname.endsWith("_integration")) throw new Error("An isolated integration database is required");
  const origin = config.projects[0].use.baseURL;
  if (!origin) throw new Error("An explicit browser test origin is required");
  const readiness = await fetch(new URL("/api/ready", origin));
  if (!readiness.ok) throw new Error("Candidate database readiness failed before browser tests");
  const database = new Pool({ connectionString });
  try {
    // Mutable test-only buckets are reset before the single-worker browser run.
    // Durable account/audit/commerce fixtures remain intact.
    await database.query('DELETE FROM "rate_limit_buckets"');
  } finally { await database.end(); }
}
