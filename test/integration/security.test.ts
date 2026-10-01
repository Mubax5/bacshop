import { createHmac, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { createDatabase } from "@/infrastructure/db/client";
import { DatabaseRateLimiter } from "@/infrastructure/security/rate-limiter";

const connectionString = process.env.BACSHOP_INTEGRATION_DATABASE_URL;
if (!connectionString || !new URL(connectionString).pathname.endsWith("_integration")) {
  throw new Error("Set BACSHOP_INTEGRATION_DATABASE_URL to an isolated database ending in _integration");
}
let database: PrismaClient | undefined;

describe("PostgreSQL security primitives", () => {
  const run = randomUUID();
  const limiterSecret = `integration-secret-${run}`;
  const limiterKey = `security-test:${run}`;
  let limiter: DatabaseRateLimiter;

  beforeAll(async () => {
    database = createDatabase(connectionString);
    limiter = new DatabaseRateLimiter(database, limiterSecret);
  });

  afterAll(async () => {
    const bucketKey = `v1:${createHmac("sha256", limiterSecret).update(limiterKey).digest("hex")}`;
    await database?.rateLimitBucket.deleteMany({ where: { bucketKey } });
    await database?.$disconnect();
  });

  it("enforces one shared atomic window under concurrent requests", async () => {
    const results = await Promise.all(Array.from({ length: 12 }, () => limiter.consume(limiterKey, { limit: 5, windowMs: 60_000 })));
    expect(results.filter((result) => result.allowed)).toHaveLength(5);
    expect(results.filter((result) => !result.allowed)).toHaveLength(7);
    expect(results.every((result) => result.remaining >= 0 && result.retryAfterSeconds >= 0)).toBe(true);
  });
});
