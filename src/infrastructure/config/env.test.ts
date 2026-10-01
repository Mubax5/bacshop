import { describe, expect, it } from "vitest";
import { ConfigurationError, loadConfig } from "./env";

const productionEnvironment = {
  NODE_ENV: "production",
  BACSHOP_RUNTIME: "database",
  APP_ORIGIN: "https://shop.example.com",
  TRUSTED_ORIGINS: "https://shop.example.com",
  DATABASE_URL: "postgresql://app:integration-only-credential@db.example.com:5432/bacshop",
  SESSION_SECRET: "0123456789abcdef".repeat(4),
  MFA_ENCRYPTION_KEY: "abcdef0123456789".repeat(4),
  MEDIA_STORAGE: "object",
  OBJECT_STORAGE_PROVIDER: "s3-compatible",
  OBJECT_STORAGE_ENDPOINT: "https://storage.example.com",
  OBJECT_STORAGE_BUCKET: "bacshop-media",
  OBJECT_STORAGE_PUBLIC_BASE_URL: "https://media.example.com",
  OBJECT_STORAGE_ACCESS_KEY: "access-key",
  OBJECT_STORAGE_SECRET_KEY: "object-secret-value",
  RATE_LIMIT_PROVIDER: "redis",
  REDIS_URL: "redis://cache.example.com:6379/0",
} as const;

describe("application environment", () => {
  it("keeps local development lazy and uses development runtime defaults", () => {
    const config = loadConfig({ NODE_ENV: "development" });
    expect(config.runtime).toBe("development");
    expect(config.database.url).toBeUndefined();
    expect(config.media.storage).toBe("local");
  });

  it("requires production database runtime and deployment boundaries", () => {
    expect(() => loadConfig({ NODE_ENV: "production" })).toThrow(ConfigurationError);
    try {
      loadConfig({ NODE_ENV: "production" });
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigurationError);
      expect((error as ConfigurationError).message).not.toContain("password");
      expect((error as ConfigurationError).issues.map((issue) => issue.path.join("."))).toContain("DATABASE_URL");
    }
  });

  it("accepts a complete production configuration", () => {
    const config = loadConfig(productionEnvironment);
    expect(config.runtime).toBe("database");
    expect(config.isProduction).toBe(true);
    expect(config.trustedOrigins).toEqual(["https://shop.example.com"]);
  });

  it("rejects localhost origins in production", () => {
    expect(() => loadConfig({ ...productionEnvironment, APP_ORIGIN: "http://localhost:3000", TRUSTED_ORIGINS: "http://localhost:3000" })).toThrow(ConfigurationError);
  });

  it("rejects development mode, placeholder keys and malformed database URLs", () => {
    for (const change of [
      { BACSHOP_RUNTIME: "development" },
      { DATABASE_URL: "postgres-but-not-a-url" },
      { DATABASE_URL: "postgresql://USER:PASSWORD@HOST:5432/DATABASE" },
      { SESSION_SECRET: "replace-with-a-random-value-at-least-32-characters" },
      { MFA_ENCRYPTION_KEY: "a".repeat(64) },
    ]) expect(() => loadConfig({ ...productionEnvironment, ...change })).toThrow(ConfigurationError);
  });

  it("rejects origin paths, credentials, and queries", () => {
    for (const origin of ["https://shop.example.com/path", "https://user:secret@shop.example.com", "https://shop.example.com?token=private"]) {
      expect(() => loadConfig({ ...productionEnvironment, APP_ORIGIN: origin, TRUSTED_ORIGINS: origin })).toThrow(ConfigurationError);
    }
  });

  it("selects the official production Midtrans endpoint and rejects custom destinations", () => {
    const configured = { ...productionEnvironment, MIDTRANS_ENABLED: "true", MIDTRANS_SERVER_KEY: "integration-test-only-value", MIDTRANS_IS_PRODUCTION: "true" };
    expect(loadConfig(configured).payments.midtrans.apiBaseUrl).toBe("https://api.midtrans.com");
    for (const url of ["https://api.sandbox.midtrans.com", "https://attacker.example.com", "https://api.midtrans.com:444", "https://api.midtrans.com?destination=secret"]) {
      expect(() => loadConfig({ ...configured, MIDTRANS_API_BASE_URL: url })).toThrow(ConfigurationError);
    }
  });

  it("requires object credentials or IAM and a shared production rate limit backend", () => {
    expect(() => loadConfig({ ...productionEnvironment, OBJECT_STORAGE_ACCESS_KEY: undefined })).toThrow(ConfigurationError);
    expect(() => loadConfig({ ...productionEnvironment, RATE_LIMIT_PROVIDER: "memory" })).toThrow(ConfigurationError);
    expect(loadConfig({ ...productionEnvironment, RATE_LIMIT_PROVIDER: "database" }).rateLimit.provider).toBe("database");
  });
});
