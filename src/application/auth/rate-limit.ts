import { getConfig } from "@/infrastructure/config/env";
import { getDatabase } from "@/infrastructure/db/client";
import { DatabaseRateLimiter, type RateLimitResult } from "@/infrastructure/security/rate-limiter";
import { getIdentityService } from "./identity";

const limiterGlobal = globalThis as typeof globalThis & { bacshopAuthRateLimiter?: DatabaseRateLimiter };

function limiter(): DatabaseRateLimiter {
  if (limiterGlobal.bacshopAuthRateLimiter) return limiterGlobal.bacshopAuthRateLimiter;
  const config = getConfig();
  const value = new DatabaseRateLimiter(getDatabase(), process.env.SESSION_SECRET ?? config.auth.sessionSecret);
  limiterGlobal.bacshopAuthRateLimiter = value;
  return value;
}

function clientKey(request: Request, trustedProxy: boolean): string {
  const forwarded = trustedProxy ? request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() : undefined;
  return forwarded && forwarded.length <= 128 ? forwarded : "unknown-client";
}

export async function consumeAuthRateLimit(request: Request, action: string, email?: string, subject?: string): Promise<RateLimitResult | null> {
  if (getConfig().runtime !== "database") return null;
  const config = getConfig();
  const normalizedEmail = email?.trim().toLowerCase();
  const identity = subject ? await getIdentityService().readSession(subject) : null;
  const accountKey = normalizedEmail || identity?.userId || subject || "none";
  const accountOptions = action === "register" || action === "forgot-password"
    ? { limit: 5, windowMs: 60 * 60 * 1000 }
    : { limit: 10, windowMs: 15 * 60 * 1000 };
  const clientOptions = { ...accountOptions, limit: accountOptions.limit * 2 };
  const [client, account] = await Promise.all([
    limiter().consume(`auth:client:${action}:${clientKey(request, config.trustProxy)}`, clientOptions),
    limiter().consume(`auth:account:${action}:${accountKey}`, accountOptions),
  ]);
  return {
    allowed: client.allowed && account.allowed,
    remaining: Math.min(client.remaining, account.remaining),
    retryAfterSeconds: Math.max(client.retryAfterSeconds, account.retryAfterSeconds),
  };
}
