import { createHash, createHmac, randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

type QueryDatabase = Pick<PrismaClient, "$queryRaw">;

/** PostgreSQL-backed fixed windows. Keys are HMACed before persistence to avoid storing PII. */
export class DatabaseRateLimiter {
  constructor(private readonly database: QueryDatabase, private readonly secret?: string) {
    if (secret !== undefined && (secret.length < 16 || secret.length > 4096)) throw new Error("Invalid rate limiter secret");
  }

  async consume(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    if (typeof key !== "string" || key.length === 0 || key.length > 1024) throw new Error("Invalid rate limit key");
    if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 1_000_000) throw new Error("Invalid rate limit");
    if (!Number.isInteger(options.windowMs) || options.windowMs < 1_000 || options.windowMs > 31 * 24 * 60 * 60 * 1000) throw new Error("Invalid rate limit window");
    const hashedKey = this.keyDigest(key);
    const windowSeconds = options.windowMs / 1000;
    const rows = await this.database.$queryRaw<RateLimitRow[]>(Prisma.sql`
      WITH clock AS (
        SELECT clock_timestamp() AS now
      ), windowed AS (
        SELECT now, floor(extract(epoch FROM now) / ${windowSeconds})::bigint AS window_number
        FROM clock
      ), saved AS (
        INSERT INTO "rate_limit_buckets" ("id", "bucketKey", "windowStart", "count", "expiresAt", "createdAt", "updatedAt")
        SELECT ${randomUUID()}, ${hashedKey}, to_timestamp(window_number * ${windowSeconds}), 1,
          to_timestamp((window_number + 1) * ${windowSeconds}), now, now
        FROM windowed
        ON CONFLICT ("bucketKey") DO UPDATE
        SET "count" = CASE WHEN "rate_limit_buckets"."expiresAt" <= excluded."updatedAt" THEN 1 ELSE "rate_limit_buckets"."count" + 1 END,
            "windowStart" = CASE WHEN "rate_limit_buckets"."expiresAt" <= excluded."updatedAt" THEN excluded."windowStart" ELSE "rate_limit_buckets"."windowStart" END,
            "expiresAt" = CASE WHEN "rate_limit_buckets"."expiresAt" <= excluded."updatedAt" THEN excluded."expiresAt" ELSE "rate_limit_buckets"."expiresAt" END,
            "updatedAt" = excluded."updatedAt"
        RETURNING "count", "expiresAt"
      )
      SELECT "count", "expiresAt", greatest(0, ceil(extract(epoch FROM ("expiresAt" - clock_timestamp()))))::int AS "retryAfterSeconds"
      FROM saved
    `);
    const row = rows[0];
    if (!row) throw new Error("Rate limiter did not return a bucket");
    const count = Number(row.count);
    const retryAfterSeconds = Math.max(0, Number(row.retryAfterSeconds));
    return { allowed: count <= options.limit, remaining: Math.max(0, options.limit - count), retryAfterSeconds };
  }

  private keyDigest(key: string): string {
    return this.secret === undefined
      ? `v1:${createHash("sha256").update(key, "utf8").digest("hex")}`
      : `v1:${createHmac("sha256", this.secret).update(key, "utf8").digest("hex")}`;
  }
}

interface RateLimitRow {
  count: number | bigint;
  expiresAt: Date;
  retryAfterSeconds: number | bigint;
}
